/**
 * HTTP-клиент API v2 Bnovo.
 *
 * База: https://api.pms.bnovo.ru
 * Авторизация: POST /api/v1/auth с ключами пользователя -> JWT,
 * далее заголовок Authorization: Bearer {token}.
 *
 * Обработка ошибок:
 *  - 401: токен истёк/невалиден -> получить новый через /api/v1/auth и повторить;
 *  - 429: превышен лимит -> выждать ~1 минуту и повторить;
 *  - троттлинг через RateLimiter для соблюдения лимитов запросов.
 */

import { RateLimiter } from "./rate-limit";
import type {
  BnovoAuthResponse,
  BnovoBooking,
  BnovoClosedDate,
  BnovoRoom,
  BnovoRoomType,
  BnovoTariff,
  BnovoWebhookEvent,
  BnovoWebhookSubscriber,
} from "./types";

export const BNOVO_BASE_URL = "https://api.pms.bnovo.ru";

const AUTH_PATH = "/api/v1/auth";
const BOOKINGS_PATH = "/bookings";
const ROOMS_PATH = "/rooms";
const ROOMS_CLOSED_PATH = "/rooms/closed";
const ROOMTYPES_PATH = "/roomtypes";
const TARIFFS_PATH = "/tariffs";
const AVAILABILITY_ROOMS_PATH = "/availability/rooms";
const AVAILABILITY_ROOMTYPES_PATH = "/availability/roomtypes";
const WEBHOOKS_SUBSCRIBERS_PATH = "/webhooks/subscribers";

const MAX_RETRIES = 3;

interface RequestOptions {
  method?: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

export class BnovoError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly fields?: string[]
  ) {
    super(message);
    this.name = "BnovoError";
  }
}

export class BnovoClient {
  private readonly rateLimiter = new RateLimiter();
  private token: string | null = null;
  private tokenExpiresAt = 0;

  constructor(
    private readonly login: string,
    private readonly password: string,
    private readonly baseUrl: string = BNOVO_BASE_URL
  ) {}

  get hasToken(): boolean {
    return Boolean(this.token) && Date.now() < this.tokenExpiresAt;
  }

  /** Возвращает текущий кэшированный токен (без продления). */
  get cachedToken(): string | null {
    return this.token;
  }

  setCachedToken(token: string | null, expiresInSec = 3600): void {
    this.token = token;
    this.tokenExpiresAt =
      token && expiresInSec > 0 ? Date.now() + expiresInSec * 1000 : 0;
  }

  private async authenticateInternal(): Promise<BnovoAuthResponse> {
    await this.rateLimiter.acquire("auth");
    const res = await fetch(`${this.baseUrl}${AUTH_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: this.login, password: this.password }),
    });
    const data = (await res.json().catch(() => ({}))) as BnovoAuthResponse;
    if (!res.ok) {
      throw new BnovoError(
        data?.message ?? data?.error ?? "Ошибка авторизации Bnovo",
        res.status
      );
    }
    const token = data.token ?? data.access_token ?? null;
    if (!token) {
      throw new BnovoError("Канал не вернул токен", res.status);
    }
    const expiresIn = data.expires_in ?? 3600;
    this.setCachedToken(token, Number(expiresIn));
    return data;
  }

  /** Получает свежий токен и возвращает его. */
  async authenticate(): Promise<string> {
    if (this.hasToken && this.token) return this.token;
    const data = await this.authenticateInternal();
    return (data.token ?? data.access_token)!;
  }

  /**
   * Универсальный запрос к API с ретраями при 401 (повторная авторизация)
   * и 429 (ожидание ~1 минуты).
   */
  private async request<T>(
    path: string,
    opts: RequestOptions = {}
  ): Promise<T> {
    const method = opts.method ?? "GET";
    let retries = 0;

    for (;;) {
      if (!this.hasToken && method !== "GET") {
        await this.authenticate();
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (this.token) headers.Authorization = `Bearer ${this.token}`;

      const query = new URLSearchParams();
      if (opts.query) {
        for (const [k, v] of Object.entries(opts.query)) {
          if (v !== undefined) query.set(k, String(v));
        }
      }
      const qs = query.toString();

      await this.rateLimiter.acquire("regular");

      let res: Response;
      try {
        res = await fetch(`${this.baseUrl}${path}${qs ? `?${qs}` : ""}`, {
          method,
          headers,
          body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
          cache: "no-store",
        });
      } catch (err) {
        if (retries < MAX_RETRIES) {
          retries += 1;
          await sleep(500 * retries);
          continue;
        }
        throw new BnovoError(
          `Сетевая ошибка Bnovo: ${(err as Error).message}`,
          0
        );
      }

      if (res.status === 401) {
        this.setCachedToken(null);
        await this.authenticateInternal();
        retries += 1;
        if (retries <= MAX_RETRIES) continue;
        throw new BnovoError("Не удалось авторизоваться в Bnovo", 401);
      }

      if (res.status === 429) {
        if (retries < MAX_RETRIES) {
          retries += 1;
          await sleep(60_000);
          continue;
        }
        throw new BnovoError("Превышен лимит запросов к Bnovo", 429);
      }

      let data: unknown = null;
      if (res.status !== 204) {
        data = await res.json().catch(() => null);
      }

      if (res.status === 406) {
        const fields = Array.isArray(data)
          ? undefined
          : extractFields((data as { error?: { fields?: string[] } })?.error);
        throw new BnovoError(
          "Ошибка валидации данных Bnovo",
          res.status,
          fields
        );
      }

      if (!res.ok) {
        const message =
          (data as { message?: string })?.message ??
          (data as { error?: string })?.error ??
          `Ошибка Bnovo (${res.status})`;
        throw new BnovoError(message, res.status);
      }

      return data as T;
    }
  }

  // ---- Авторизация / профиль ----

  async me(): Promise<{ id?: string; login?: string; [k: string]: unknown }> {
    return this.request("/auth/me");
  }

  async logout(): Promise<void> {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } catch {
      /* игнорируем ошибки выхода */
    }
  }

  // ---- Бронирования ----

  getBookings(dateFrom: string, dateTo: string): Promise<BnovoBooking[]> {
    return this.request(BOOKINGS_PATH, {
      query: { date_from: dateFrom, date_to: dateTo },
    });
  }

  getBooking(id: string | number): Promise<BnovoBooking> {
    return this.request(`${BOOKINGS_PATH}/${id}`);
  }

  /** Создаёт бронь в Bnovo как занятые даты. */
  createBooking(payload: Record<string, unknown>): Promise<BnovoBooking> {
    return this.request(BOOKINGS_PATH, { method: "POST", body: payload });
  }

  updateBookingStatus(id: string | number, status: string): Promise<unknown> {
    return this.request(`${BOOKINGS_PATH}/${id}/status`, {
      method: "PUT",
      body: { status },
    });
  }

  saveGuests(
    id: string | number,
    guests: { name?: string; phone?: string; email?: string }
  ): Promise<unknown> {
    return this.request(`${BOOKINGS_PATH}/${id}/guests`, {
      method: "PUT",
      body: guests,
    });
  }

  // ---- Комнаты и наличие ----

  getRooms(): Promise<BnovoRoom[]> {
    return this.request(ROOMS_PATH);
  }

  getRoomsClosed(): Promise<BnovoClosedDate[]> {
    return this.request(ROOMS_CLOSED_PATH);
  }

  getAvailabilityRooms(query?: Record<string, string>): Promise<unknown> {
    return this.request(AVAILABILITY_ROOMS_PATH, { query });
  }

  getAvailabilityRoomTypes(query?: Record<string, string>): Promise<unknown> {
    return this.request(AVAILABILITY_ROOMTYPES_PATH, { query });
  }

  /** Публикует закрытие продаж (закрытые даты) в канал. */
  setClosedSales(
    payload: Array<{
      date_from: string;
      date_to: string;
      room_type_id?: string | number;
    }>
  ): Promise<unknown> {
    return this.request(AVAILABILITY_ROOMTYPES_PATH, {
      method: "PUT",
      body: payload,
    });
  }

  /** Публикует цены тарифа для типа комнаты по датам. */
  setTariffPrices(planId: string | number, payload: unknown): Promise<unknown> {
    return this.request(`${TARIFFS_PATH}/prices/${planId}`, {
      method: "PUT",
      body: payload,
    });
  }

  // ---- Типы комнат и тарифы ----

  getRoomTypes(): Promise<BnovoRoomType[]> {
    return this.request(ROOMTYPES_PATH);
  }

  getTariffs(): Promise<BnovoTariff[]> {
    return this.request(TARIFFS_PATH);
  }

  getTariffPrices(planId: string | number): Promise<unknown> {
    return this.request(`${TARIFFS_PATH}/prices/${planId}`);
  }

  // ---- Вебхуки ----

  getWebhooks(): Promise<BnovoWebhookSubscriber[]> {
    return this.request(WEBHOOKS_SUBSCRIBERS_PATH);
  }

  createWebhook(subscriber: {
    type: string;
    url: string;
  }): Promise<BnovoWebhookSubscriber> {
    return this.request(WEBHOOKS_SUBSCRIBERS_PATH, {
      method: "POST",
      body: subscriber,
    });
  }

  deleteWebhook(id: string | number): Promise<unknown> {
    return this.request(`${WEBHOOKS_SUBSCRIBERS_PATH}/${id}`, {
      method: "DELETE",
    });
  }

  /** Публикует событие вебхука Bnovo на наш endpoint. */
  async dispatchWebhookEvent(
    url: string,
    event: BnovoWebhookEvent
  ): Promise<Response> {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  }
}

function extractFields(error?: { fields?: string[] }): string[] | undefined {
  if (!error || !Array.isArray(error.fields)) return undefined;
  return error.fields.map(String);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
