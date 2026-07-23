import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getOrderSettings, saveOrderSettings } from "@/lib/models";
import { mockOrderSettings } from "@/lib/mock-data";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

const saveOrderSettingsSchema = z.object({
  orderFormEnabled: z.boolean(),
});

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.cookies.get("admin_token");
  return cookie?.value ?? null;
}

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const settings = await getOrderSettings();
      if (settings) {
        return NextResponse.json(settings);
      }
      return NextResponse.json(mockOrderSettings);
    } catch (error) {
      console.error("Ошибка получения настроек заказа:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockOrderSettings);
}

export async function PUT(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = saveOrderSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const settings = await saveOrderSettings(parsed.data);

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Ошибка сохранения настроек заказа:", error);
    return NextResponse.json(
      { error: "Ошибка сохранения настроек" },
      { status: 500 }
    );
  }
}
