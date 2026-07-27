import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getClientByEmail, updateClient } from "@/lib/models";
import { getClientEmailFromRequest } from "@/lib/client-auth";
import { z } from "zod";

const toggleSchema = z.object({
  enabled: z.boolean(),
});

const chatIdSchema = z.object({
  chatId: z.string().min(1).max(100),
});

export async function GET(request: NextRequest) {
  try {
    const clientEmail = getClientEmailFromRequest(request);
    if (!clientEmail) {
      return NextResponse.json(
        { error: "Необходимо авторизоваться" },
        { status: 401 }
      );
    }

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json({ enabled: false, chatId: null });
    }

    const client = await getClientByEmail(clientEmail);
    return NextResponse.json({
      enabled: client?.telegramNotificationsEnabled ?? false,
      chatId: client?.telegramChatId ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const clientEmail = getClientEmailFromRequest(request);
    if (!clientEmail) {
      return NextResponse.json(
        { error: "Необходимо авторизоваться" },
        { status: 401 }
      );
    }

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "База данных недоступна" },
        { status: 503 }
      );
    }

    const body = await request.json();

    if (body.chatId !== undefined) {
      const parsed = chatIdSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: "Некорректный Telegram ID",
            details: parsed.error.flatten(),
          },
          { status: 400 }
        );
      }
      await updateClient(clientEmail, { telegramChatId: parsed.data.chatId });
      return NextResponse.json({ chatId: parsed.data.chatId });
    }

    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await updateClient(clientEmail, {
      telegramNotificationsEnabled: parsed.data.enabled,
    });

    return NextResponse.json({ enabled: parsed.data.enabled });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
