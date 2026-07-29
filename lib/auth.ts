import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { MAIN_ADMIN_EMAIL } from "@noble-peak/shared";
import type { NextRequest } from "next/server";

export {
  createToken,
  verifyToken,
  getMainAdminEmail,
  isMainAdminEmail,
  isMainAdminPayload,
  MAIN_ADMIN_EMAIL,
  type TokenPayload,
} from "@noble-peak/shared";

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.cookies.get("admin_token");
  return cookie?.value ?? null;
}

const MAIN_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Artkmv11";

function hashAndSalt(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyHash(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(hash, "hex");
  if (derived.length !== storedBuf.length) return false;
  return timingSafeEqual(derived, storedBuf);
}

const MAIN_ADMIN_PASSWORD_HASH = hashAndSalt(MAIN_ADMIN_PASSWORD);

export function hashAdminPassword(password: string): string {
  return hashAndSalt(password);
}

export function verifyAdminPassword(password: string, stored: string): boolean {
  return verifyHash(password, stored);
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<{ email: string; role: "main_admin" | "admin" } | null> {
  if (email === process.env.ADMIN_EMAIL || email === MAIN_ADMIN_EMAIL) {
    if (verifyAdminPassword(password, MAIN_ADMIN_PASSWORD_HASH)) {
      return { email, role: "main_admin" };
    }
    return null;
  }

  try {
    const { getAdminByEmail, updateAdmin } = await import("./models");
    const admin = await getAdminByEmail(email);
    if (!admin) return null;

    const stored = admin.password;
    const isHashed = stored.includes(":");

    if (isHashed) {
      if (!verifyAdminPassword(password, stored)) return null;
      return { email, role: admin.role };
    }

    if (stored !== password) return null;

    const hashed = hashAdminPassword(password);
    await updateAdmin(email, { password: hashed });
    return { email, role: admin.role };
  } catch {
    return null;
  }
}
