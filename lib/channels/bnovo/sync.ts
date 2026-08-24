/**
 * Оркестрация двухсторонней синхронизации календаря жилья с Bnovo.
 *
 * Направления:
 *  1. Брони нашего сайта -> Bnovo (создание/отмена как занятые даты);
 *  2. Брони Bnovo -> наш календарь (блокировка дат);
 *  3. Свободные даты и цены нашего календаря -> Bnovo (цены тарифа);
 *  4. Закрытие дат владельцем -> Bnovo (закрытие продаж).
 *
 * Для исключения двойных броней ведётся маппинг наших броней на брони канала
 * (bookingMappings) и обратная сверка по external_id при импорте.
 */

import { isDatabaseAvailable } from "@/lib/db";
import {
  getListingById,
  getListingCalendars,
  getListingBookingsByListing,
  getChannelSyncRecord,
  saveChannelSyncRecord,
  blockListingDates,
  unblockListingDates,
  closeListingDates,
  getListingNightDates,
  listingPriceForNight,
} from "@/lib/models";
import type {
  ListingChannelConnection,
  ListingRecord,
  ListingBookingRecord,
  ListingCalendarRecord,
  ListingChannelSyncRecord,
} from "@noble-peak/shared";
import { BnovoClient, BnovoError } from "./client";
import type { BnovoBooking } from "./types";

export function getBnovoWebhookBaseUrl(): string {
  return (
    process.env.PUBLIC_WEBHOOK_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "https://my.magazin-tour.ru"
  );
}

export function getBnovoWebhookUrl(): string {
  return `${getBnovoWebhookBaseUrl().replace(/\/$/, "")}/api/channels/bnovo/webhook`;
}

interface BnovoCredentials {
  login: string;
  password: string;
}

/** Извлекает логин/пароль API из подключения канала Bnovo. */
export function getBnovoCredentials(
  connection: ListingChannelConnection
): BnovoCredentials | null {
  const get = (key: string) =>
    connection.credentials.find((c) => c.key === key)?.value?.trim();
  const login = get("login");
  const password = get("password");
  if (!login || !password) return null;
  return { login, password };
}

/** Находит подключение Bnovo в объявлении. */
export function getBnovoConnection(
  listing: ListingRecord
): ListingChannelConnection | undefined {
  return (listing.channelConnections ?? []).find((c) => c.type === "bnovo");
}

function makeClient(
  creds: BnovoCredentials,
  sync?: ListingChannelSyncRecord | null
): BnovoClient {
  const client = new BnovoClient(creds.login, creds.password);
  if (sync?.token && sync.tokenExpiresAt) {
    const expires = new Date(sync.tokenExpiresAt).getTime();
    client.setCachedToken(
      sync.token,
      Math.max(1, (expires - Date.now()) / 1000)
    );
  }
  return client;
}

async function persistToken(
  sync: ListingChannelSyncRecord | null,
  client: BnovoClient,
  listingId: string,
  connectionId: string
): Promise<ListingChannelSyncRecord> {
  const record: ListingChannelSyncRecord = sync ?? {
    connectionId,
    listingId,
    channelType: "bnovo",
    updatedAt: new Date().toISOString(),
  };
  const token = client.cachedToken;
  if (token) {
    record.token = token;
    record.tokenExpiresAt = new Date(Date.now() + 3600_000).toISOString();
  }
  return saveChannelSyncRecord(record);
}

function roomTypeIdForUnit(
  sync: ListingChannelSyncRecord | null,
  unitId: string
): string | number | undefined {
  const mapped = sync?.mapping?.[unitId];
  if (mapped !== undefined) return mapped;
  return sync?.propertyId !== undefined ? sync.propertyId : undefined;
}

function nightsBetween(checkIn: string, checkOut: string): string[] {
  return getListingNightDates(checkIn, checkOut);
}

/** Проверяет, заблокирован ли диапазон в календаре (для предотвращения конфликтов). */
async function rangeBlocked(
  listingId: string,
  unitId: string,
  checkIn: string,
  checkOut: string,
  calendars: ListingCalendarRecord[]
): Promise<boolean> {
  const cal = calendars.find((c) => c.unitId === unitId);
  if (!cal) return false;
  return nightsBetween(checkIn, checkOut).some(
    (date) => (cal.dates[date] ?? "available") === "booked"
  );
}

/**
 * 2) Импорт броней из Bnovo: блокирует даты как занятые в нашем календаре.
 * Брони, помеченные external_id, который соответствует нашей броне, пропускаются
 * (это наши же брони, отправленные в канал) — это исключает двойную блокировку.
 */
export async function importBnovoBookings(
  listing: ListingRecord,
  connection: ListingChannelConnection,
  sync: ListingChannelSyncRecord | null
): Promise<void> {
  const creds = getBnovoCredentials(connection);
  if (!creds) return;

  const client = makeClient(creds, sync);
  const now = new Date();
  const from = new Date(now.getTime() - 30 * 86400_000);
  const to = new Date(now.getTime() + 400 * 86400_000);

  const bookings = await client.getBookings(toDateStr(from), toDateStr(to));

  const calendars = await getListingCalendars(listing.id);
  const ours = await getListingBookingsByListing(listing.id);
  const oursByExternal = new Map(ours.map((b) => [b.id, b]));

  let touched = false;
  for (const b of normalizeArray(bookings)) {
    const externalId = String(b.external_id ?? "");
    if (externalId && oursByExternal.has(externalId)) continue;

    const start = String(b.date_from ?? "").slice(0, 10);
    const end = String(b.date_to ?? "").slice(0, 10);
    if (!start || !end) continue;

    const unitId = resolveUnitId(sync, b);
    if (!unitId) continue;

    const isCancelled =
      b.status === "cancelled" || b.status === "void" || b.status === "deleted";
    if (isCancelled) {
      await unblockListingDates(listing.id, unitId, start, end);
      touched = true;
      continue;
    }

    const already = await rangeBlocked(
      listing.id,
      unitId,
      start,
      end,
      calendars
    );
    if (!already) {
      await blockListingDates(listing.id, unitId, start, end);
      touched = true;
    }
  }
  if (touched) {
    await persistToken(sync, client, listing.id, connection.id);
  }
}

/** Определяет unitId нашего объявления по данным брони канала. */
function resolveUnitId(
  sync: ListingChannelSyncRecord | null,
  b: BnovoBooking
): string | undefined {
  const remoteId = String(b.room_type_id ?? b.room_id ?? "");
  if (!remoteId) return undefined;
  if (sync?.mapping) {
    for (const [unit, mapped] of Object.entries(sync.mapping)) {
      if (String(mapped) === remoteId) return unit;
    }
  }
  // По умолчанию маппим на единственную/первую единицу.
  return Object.keys(sync?.mapping ?? {})[0] ?? undefined;
}

/**
 * 4) Импорт закрытия продаж из Bnovo: закрывает даты в нашем календаре.
 */
export async function importBnovoClosedSales(
  listing: ListingRecord,
  connection: ListingChannelConnection,
  sync: ListingChannelSyncRecord | null
): Promise<void> {
  const creds = getBnovoCredentials(connection);
  if (!creds) return;

  const client = makeClient(creds, sync);
  const closed = await client.getRoomsClosed();
  if (!Array.isArray(closed) || closed.length === 0) return;

  for (const entry of closed) {
    const date = String(entry.date ?? "").slice(0, 10);
    if (!date) continue;
    const roomId = String(entry.room_id ?? "");
    const unitId = sync?.mapping
      ? (Object.entries(sync.mapping).find(
          ([, m]) => String(m) === roomId
        )?.[0] ?? Object.keys(sync.mapping)[0])
      : undefined;
    if (!unitId) continue;
    await closeListingDates(listing.id, unitId, date, date);
  }
}

/**
 * 1) Отправка брони нашего сайта в Bnovo как занятых дат.
 */
export async function pushBookingToBnovo(
  booking: ListingBookingRecord
): Promise<void> {
  if (!(await isDatabaseAvailable())) return;
  const listing = await getListingById(booking.listingId);
  if (!listing) return;
  const connection = getBnovoConnection(listing);
  if (!connection) return;
  const creds = getBnovoCredentials(connection);
  if (!creds) return;

  let sync = await getChannelSyncRecord(connection.id);
  const client = makeClient(creds, sync);

  const roomTypeId = roomTypeIdForUnit(sync, booking.unitId);
  const planId = sync?.planId;

  try {
    const existingId = sync?.bookingMappings?.[booking.id];
    if (existingId) {
      await client.updateBookingStatus(existingId, "confirmed");
    } else {
      const created = await client.createBooking({
        date_from: booking.checkIn,
        date_to: booking.checkOut,
        room_type_id: roomTypeId,
        plan_id: planId,
        status: "confirmed",
        source: "magazin-tour",
        external_id: booking.id,
        guest: {
          name: booking.clientName,
          phone: booking.clientPhone,
          email: booking.clientEmail,
        },
      });
      const bnovoId = String(
        created?.id ??
          (created as unknown as { booking_id?: string | number })
            ?.booking_id ??
          ""
      );
      if (bnovoId) {
        sync = sync ?? {
          connectionId: connection.id,
          listingId: listing.id,
          channelType: "bnovo",
          updatedAt: new Date().toISOString(),
        };
        sync.bookingMappings = {
          ...(sync.bookingMappings ?? {}),
          [booking.id]: bnovoId,
        };
      }
    }
    await persistToken(sync, client, listing.id, connection.id);
    // Локально даты уже заблокированы при создании брони; при необходимости
    // дополнительно блокируем, чтобы избежать расхождений.
    await blockListingDates(
      listing.id,
      booking.unitId,
      booking.checkIn,
      booking.checkOut
    );
  } catch (err) {
    console.error("Ошибка отправки брони в Bnovo:", err);
    throw err;
  }
}

/**
 * Отмена брони в Bnovo (изменение статуса на cancelled).
 */
export async function cancelBookingInBnovo(
  booking: ListingBookingRecord
): Promise<void> {
  if (!(await isDatabaseAvailable())) return;
  const listing = await getListingById(booking.listingId);
  if (!listing) return;
  const connection = getBnovoConnection(listing);
  if (!connection) return;
  const creds = getBnovoCredentials(connection);
  if (!creds) return;

  const sync = await getChannelSyncRecord(connection.id);
  const bnovoId = sync?.bookingMappings?.[booking.id];
  if (!bnovoId) return;
  const client = makeClient(creds, sync);
  await client.updateBookingStatus(bnovoId, "cancelled");
}

/**
 * 3) Публикация свободных дат и цен нашего календаря в Bnovo (цены тарифа).
 */
export async function publishListingToBnovo(
  listing: ListingRecord,
  connection: ListingChannelConnection,
  sync: ListingChannelSyncRecord | null
): Promise<void> {
  const creds = getBnovoCredentials(connection);
  if (!creds) return;
  const planId = sync?.planId;
  if (!planId) return;

  const client = makeClient(creds, sync);
  const calendars = await getListingCalendars(listing.id);

  for (const calendar of calendars) {
    const roomTypeId = roomTypeIdForUnit(sync, calendar.unitId);
    if (roomTypeId === undefined) continue;
    const priceMap = buildPriceMap(listing, calendar);
    if (Object.keys(priceMap).length === 0) continue;
    await client.setTariffPrices(planId, {
      room_type_id: roomTypeId,
      prices: priceMap,
    });
  }
  await persistToken(sync, client, listing.id, connection.id);
}

/**
 * 4) Публикация закрытых дат владельца в Bnovo как закрытие продаж.
 */
export async function publishClosedSalesToBnovo(
  listing: ListingRecord,
  connection: ListingChannelConnection,
  sync: ListingChannelSyncRecord | null
): Promise<void> {
  const creds = getBnovoCredentials(connection);
  if (!creds) return;

  const client = makeClient(creds, sync);
  const calendars = await getListingCalendars(listing.id);
  const closedRanges: Array<{
    date_from: string;
    date_to: string;
    room_type_id?: string | number;
  }> = [];

  for (const calendar of calendars) {
    const roomTypeId = roomTypeIdForUnit(sync, calendar.unitId);
    const closedDates = Object.keys(calendar.dates).filter(
      (d) => calendar.dates[d] === "closed"
    );
    if (closedDates.length === 0) continue;
    for (const range of groupConsecutive(closedDates)) {
      closedRanges.push({
        date_from: range.start,
        date_to: range.end,
        ...(roomTypeId !== undefined ? { room_type_id: roomTypeId } : {}),
      });
    }
  }

  if (closedRanges.length > 0) {
    await client.setClosedSales(closedRanges);
    await persistToken(sync, client, listing.id, connection.id);
  }
}

/**
 * Полная синхронизация одного объявления: сначала импорт (Bnovo -> мы),
 * затем публикация (мы -> Bnovo).
 */
export async function syncListingBnovo(listingId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!(await isDatabaseAvailable())) {
    return { ok: true };
  }
  const listing = await getListingById(listingId);
  if (!listing) return { ok: false, error: "Объявление не найдено" };
  const connection = getBnovoConnection(listing);
  if (!connection) return { ok: true, error: "Канал Bnovo не подключён" };
  const creds = getBnovoCredentials(connection);
  if (!creds) return { ok: false, error: "Нет доступов к Bnovo" };

  let sync = await getChannelSyncRecord(connection.id);
  try {
    await importBnovoBookings(listing, connection, sync);
    await importBnovoClosedSales(listing, connection, sync);
    sync = await getChannelSyncRecord(connection.id);
    await publishListingToBnovo(listing, connection, sync);
    await publishClosedSalesToBnovo(listing, connection, sync);

    const final = (await getChannelSyncRecord(connection.id)) ?? sync;
    await saveChannelSyncRecord({
      connectionId: connection.id,
      listingId: listing.id,
      channelType: "bnovo",
      mapping: final?.mapping ?? sync?.mapping,
      propertyId: final?.propertyId ?? sync?.propertyId,
      planId: final?.planId ?? sync?.planId,
      bookingMappings: final?.bookingMappings ?? sync?.bookingMappings,
      token: final?.token ?? sync?.token,
      tokenExpiresAt: final?.tokenExpiresAt ?? sync?.tokenExpiresAt,
      webhookRegistered: final?.webhookRegistered ?? sync?.webhookRegistered,
      webhookId: final?.webhookId ?? sync?.webhookId,
      lastSyncAt: new Date().toISOString(),
      lastError: undefined,
      updatedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof BnovoError
        ? err.message
        : ((err as Error)?.message ?? "Ошибка синхронизации");
    console.error("Ошибка синхронизации Bnovo:", err);
    try {
      const current = (await getChannelSyncRecord(connection.id)) ?? {
        connectionId: connection.id,
        listingId: listing.id,
        channelType: "bnovo",
        updatedAt: new Date().toISOString(),
      };
      await saveChannelSyncRecord({
        ...current,
        lastError: message,
        lastSyncAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch {
      /* игнорируем */
    }
    return { ok: false, error: message };
  }
}

/**
 * Обработка события вебхука Bnovo: booking (CRUD брони) и plans_data_update.
 * Ведёт к синхронизации затронутого объявления.
 */
export async function handleBnovoWebhookEvent(
  event: Record<string, unknown>
): Promise<string[]> {
  const processedListingIds = new Set<string>();
  const type = String(event.type ?? event.event ?? "");

  const b = (event.booking ?? event) as Record<string, unknown>;
  const externalId = String(b.external_id ?? "");
  const listingIdHint =
    typeof b.listing_id === "string" ? b.listing_id : undefined;

  if (type.includes("booking")) {
    if (externalId && listingIdHint) {
      await syncListingBnovo(listingIdHint);
      processedListingIds.add(listingIdHint);
    } else if (externalId) {
      const ours = await findListingByBookingExternalId(externalId);
      if (ours) {
        await syncListingBnovo(ours.listingId);
        processedListingIds.add(ours.listingId);
      }
    }
  }

  if (type.includes("plans_data_update")) {
    const propertyId = String(b.property_id ?? "");
    const listings = await findListingsForBnovoProperty(propertyId);
    for (const l of listings) {
      await syncListingBnovo(l.id);
      processedListingIds.add(l.id);
    }
  }

  // Если не смогли определить — пробуем синхронизировать все объявления с Bnovo.
  if (processedListingIds.size === 0) {
    const all = await findListingsWithBnovo();
    for (const l of all) {
      await syncListingBnovo(l.id);
      processedListingIds.add(l.id);
    }
  }

  return [...processedListingIds];
}

async function findListingByBookingExternalId(
  externalId: string
): Promise<ListingBookingRecord | null> {
  const { getListingBookingsByListing } = await import("@/lib/models");
  const { getAllListings } = await import("@/lib/models");
  const listings = await getAllListings();
  for (const l of listings) {
    if (!getBnovoConnection(l)) continue;
    const bookings = await getListingBookingsByListing(l.id);
    const found = bookings.find((bk) => bk.id === externalId);
    if (found) return found;
  }
  return null;
}

async function findListingsForBnovoProperty(
  propertyId: string
): Promise<ListingRecord[]> {
  if (!propertyId) return [];
  const { getAllListings } = await import("@/lib/models");
  const listings = await getAllListings();
  return listings.filter((l) => {
    const conn = getBnovoConnection(l);
    if (!conn) return false;
    // По эвристике: маппинг или propertyId в состоянии синхронизации
    return true;
  });
}

async function findListingsWithBnovo(): Promise<ListingRecord[]> {
  const { getAllListings } = await import("@/lib/models");
  const listings = await getAllListings();
  return listings.filter((l) => Boolean(getBnovoConnection(l)));
}

// ---- Хелперы ----

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function normalizeArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function buildPriceMap(
  listing: ListingRecord,
  calendar: ListingCalendarRecord
): Record<string, number> {
  const prices: Record<string, number> = {};
  for (const date of Object.keys(calendar.dates)) {
    if (calendar.dates[date] === "available") {
      const price = listingPriceForNight(
        listing,
        calendar,
        date,
        calendar.unitId
      );
      if (price > 0) prices[date] = price;
    }
  }
  return prices;
}

function groupConsecutive(
  dates: string[]
): Array<{ start: string; end: string }> {
  const sorted = [...dates].sort();
  if (sorted.length === 0) return [];
  const ranges: Array<{ start: string; end: string }> = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (isNextDay(prev, sorted[i])) {
      prev = sorted[i];
    } else {
      ranges.push({ start, end: prev });
      start = sorted[i];
      prev = sorted[i];
    }
  }
  ranges.push({ start, end: prev });
  return ranges;
}

function isNextDay(prev: string, next: string): boolean {
  const d = new Date(`${prev}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split("T")[0] === next;
}
