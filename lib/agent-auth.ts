import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const TOKEN_PREFIX = "magazin_tour_agent_v1:";

export interface AgentCredentials {
  name: string;
  phone: string;
  email: string;
  password: string;
}

export interface AgentData {
  name: string;
  phone: string;
  email: string;
  code: string;
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

export function createAgentToken(email: string): string {
  const payload = JSON.stringify({ email, ts: Date.now() });
  return Buffer.from(TOKEN_PREFIX + payload).toString("base64");
}

export function verifyAgentToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    if (!decoded.startsWith(TOKEN_PREFIX)) return null;
    const payload = JSON.parse(decoded.slice(TOKEN_PREFIX.length));
    return payload.email || null;
  } catch {
    return null;
  }
}

export function generateAgentCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `AG-${code}`;
}

export { hashPassword, verifyPassword };

import type { NextRequest } from "next/server";

export function getAgentEmailFromRequest(request: NextRequest): string | null {
  const token =
    request.cookies.get("agent_token")?.value ??
    request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return verifyAgentToken(token);
}
