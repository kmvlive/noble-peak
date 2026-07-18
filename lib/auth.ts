const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@magazin-tour.ru";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const TOKEN_PREFIX = "magazin_tour_admin_v1:";

export function verifyCredentials(email: string, password: string): boolean {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

export function createToken(): string {
  const payload = JSON.stringify({
    email: ADMIN_EMAIL,
    ts: Date.now(),
  });
  const encoded = Buffer.from(TOKEN_PREFIX + payload).toString("base64");
  return encoded;
}

export function verifyToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    if (!decoded.startsWith(TOKEN_PREFIX)) return false;
    const payload = JSON.parse(decoded.slice(TOKEN_PREFIX.length));
    return payload.email === ADMIN_EMAIL;
  } catch {
    return false;
  }
}

export function getAdminEmail(): string {
  return ADMIN_EMAIL;
}
