import { createHash } from "node:crypto";

let _terminalKey: string | undefined;
let _password: string | undefined;

export function setPaymentCredentials(
  terminalKey: string,
  password: string
): void {
  _terminalKey = terminalKey;
  _password = password;
}

export function clearPaymentCredentials(): void {
  _terminalKey = undefined;
  _password = undefined;
}

const TINKOFF_API_URL =
  process.env.TINKOFF_API_URL ?? "https://securepay.tinkoff.ru/v2";

function getTerminalKey(): string {
  return _terminalKey ?? process.env.TINKOFF_TERMINAL_KEY ?? "";
}

function getPassword(): string {
  return _password ?? process.env.TINKOFF_PASSWORD ?? "";
}

function getBaseUrl(): string {
  return process.env.BASE_URL ?? "http://localhost:8080";
}

function generateToken(
  params: Record<string, unknown>,
  password: string
): string {
  const keys = Object.keys(params).sort();
  const values = keys.map((k) => String(params[k]));
  values.push(password);
  return createHash("sha256").update(values.join("")).digest("hex");
}

export interface TinkoffInitResponse {
  Success: boolean;
  ErrorCode: string;
  Message?: string;
  Details?: string;
  PaymentId?: string;
  PaymentURL?: string;
}

export interface TinkoffGetStateResponse {
  Success: boolean;
  ErrorCode: string;
  Message?: string;
  Status?: string;
  PaymentId?: string;
  OrderId?: string;
}

export async function initPayment(
  orderId: string,
  amountKopecks: number,
  description: string,
  baseUrl?: string
): Promise<TinkoffInitResponse> {
  const terminalKey = getTerminalKey();
  const password = getPassword();
  const resolvedBaseUrl = baseUrl ?? getBaseUrl();

  if (!terminalKey || !password) {
    return {
      Success: false,
      ErrorCode: "CONFIG_ERROR",
      Message: "Платёжная система не настроена",
    };
  }

  const params: Record<string, unknown> = {
    TerminalKey: terminalKey,
    Amount: amountKopecks,
    OrderId: orderId,
    Description: description,
    NotificationURL: `${resolvedBaseUrl}/api/payments/callback`,
    SuccessURL: `${resolvedBaseUrl}/payment/success?bookingId=${orderId}`,
    FailURL: `${resolvedBaseUrl}/payment/fail?bookingId=${orderId}`,
  };

  params.Token = generateToken(params, password);

  try {
    const res = await fetch(`${TINKOFF_API_URL}/Init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    return await res.json();
  } catch {
    return {
      Success: false,
      ErrorCode: "NETWORK_ERROR",
      Message: "Не удалось соединиться с платёжной системой",
    };
  }
}

export async function getPaymentStatus(
  paymentId: string
): Promise<TinkoffGetStateResponse> {
  const terminalKey = getTerminalKey();
  const password = getPassword();

  if (!terminalKey || !password) {
    return {
      Success: false,
      ErrorCode: "CONFIG_ERROR",
      Message: "Платёжная система не настроена",
    };
  }

  const params: Record<string, unknown> = {
    TerminalKey: terminalKey,
    PaymentId: paymentId,
  };

  params.Token = generateToken(params, password);

  try {
    const res = await fetch(`${TINKOFF_API_URL}/GetState`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    return await res.json();
  } catch {
    return {
      Success: false,
      ErrorCode: "NETWORK_ERROR",
      Message: "Не удалось проверить статус платежа",
    };
  }
}

export function verifyNotificationToken(
  params: Record<string, unknown>,
  token: string
): boolean {
  const password = getPassword();
  if (!password) return false;
  const expected = generateToken(params, password);
  return expected === token;
}

export function isPaymentSuccessful(status: string): boolean {
  return ["CONFIRMED", "AUTHORIZED"].includes(status);
}

export function isPaymentFailed(status: string): boolean {
  return ["CANCELED", "REJECTED", "DEADLINE_EXPIRED"].includes(status);
}
