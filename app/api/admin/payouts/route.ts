import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllPayouts } from "@/lib/models";
import { mockPayouts } from "@/lib/mock-data";
import { verifyToken, isMainAdminPayload } from "@/lib/auth";

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.cookies.get("admin_token");
  return cookie?.value ?? null;
}

function authorized(request: NextRequest): boolean {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  return Boolean(payload && isMainAdminPayload(payload));
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();
  const payouts = dbAvailable ? await getAllPayouts() : mockPayouts;

  return NextResponse.json({ payouts });
}
