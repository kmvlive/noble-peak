export const MAIN_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "artkmv1@ya.ru";
const TOKEN_PREFIX = "magazin_tour_admin_v1:";

export interface TokenPayload {
  email: string;
  role: "main_admin" | "admin";
  ts: number;
}

export function createToken(
  email: string,
  role: "main_admin" | "admin"
): string {
  const payload: TokenPayload = { email, role, ts: Date.now() };
  const encoded = Buffer.from(TOKEN_PREFIX + JSON.stringify(payload)).toString(
    "base64"
  );
  return encoded;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    if (!decoded.startsWith(TOKEN_PREFIX)) return null;
    const payload = JSON.parse(decoded.slice(TOKEN_PREFIX.length));
    if (!payload.email || !payload.role) return null;
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export function getMainAdminEmail(): string {
  return MAIN_ADMIN_EMAIL;
}

export function isMainAdminEmail(email: string): boolean {
  return email === MAIN_ADMIN_EMAIL;
}

export function isMainAdminPayload(payload: TokenPayload): boolean {
  return payload.role === "main_admin";
}
