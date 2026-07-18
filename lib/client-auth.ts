import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const TOKEN_PREFIX = "magazin_tour_client_v1:";

export interface ClientCredentials {
  name: string;
  phone: string;
  email: string;
  password: string;
}

export interface ClientData {
  name: string;
  phone: string;
  email: string;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(hash, "hex");
  if (derived.length !== storedBuf.length) return false;
  return timingSafeEqual(derived, storedBuf);
}

export function createClientToken(email: string): string {
  const payload = JSON.stringify({ email, ts: Date.now() });
  return Buffer.from(TOKEN_PREFIX + payload).toString("base64");
}

export function verifyClientToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    if (!decoded.startsWith(TOKEN_PREFIX)) return null;
    const payload = JSON.parse(decoded.slice(TOKEN_PREFIX.length));
    return payload.email || null;
  } catch {
    return null;
  }
}

export function generatePassword(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export { hashPassword, verifyPassword };
