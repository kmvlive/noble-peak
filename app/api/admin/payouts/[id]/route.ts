import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { updatePayoutStatus } from "@/lib/models";
import { verifyToken, isMainAdminPayload } from "@/lib/auth";

const updateSchema = z.object({
  status: z.enum(["approved", "declined", "paid"]),
});

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payout = await updatePayoutStatus(id, parsed.data.status);
    return NextResponse.json({ payout });
  } catch {
    return NextResponse.json(
      { error: "Ошибка обновления выплаты" },
      { status: 500 }
    );
  }
}
