import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getPaymentSettings, savePaymentSettings } from "@/lib/models";
import { mockPaymentSettings } from "@/lib/mock-data";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { z } from "zod";

const savePaymentSettingsSchema = z.object({
  terminalKey: z.string().min(1, "TerminalKey обязателен"),
  password: z.string().min(1, "Password обязателен"),
  webhookUrl: z.string().url("Некорректный URL вебхука"),
});

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const settings = await getPaymentSettings();
      if (settings) {
        return NextResponse.json(settings);
      }
      return NextResponse.json(mockPaymentSettings);
    } catch (error) {
      console.error("Ошибка получения настроек оплаты:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockPaymentSettings);
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
    const parsed = savePaymentSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const settings = await savePaymentSettings(parsed.data);

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Ошибка сохранения настроек оплаты:", error);
    return NextResponse.json(
      { error: "Ошибка сохранения настроек" },
      { status: 500 }
    );
  }
}
