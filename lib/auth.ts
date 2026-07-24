export {
  createToken,
  verifyToken,
  getMainAdminEmail,
  isMainAdminEmail,
  isMainAdminPayload,
  type TokenPayload,
} from "@noble-peak/shared";
export { MAIN_ADMIN_EMAIL } from "@noble-peak/shared";

const MAIN_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Artkmv11";

export async function verifyCredentials(
  email: string,
  password: string
): Promise<{ email: string; role: "main_admin" | "admin" } | null> {
  if (email === process.env.ADMIN_EMAIL && password === MAIN_ADMIN_PASSWORD) {
    return { email, role: "main_admin" };
  }

  try {
    const { getAdminByEmail } = await import("./models");
    const admin = await getAdminByEmail(email);
    if (admin && admin.password === password) {
      const role =
        email === process.env.ADMIN_EMAIL ? "main_admin" : admin.role;
      return { email, role };
    }
  } catch {}

  return null;
}
