import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getAgentByEmail, updateAgent } from "@/lib/models";
import { getAgentEmailFromRequest } from "@/lib/agent-auth";
import { z } from "zod";

const toggleSchema = z.object({
  enabled: z.boolean(),
});

const chatIdSchema = z.object({
  chatId: z.string().min(1).max(100),
});

export async function GET(request: NextRequest) {
  const agentEmail = getAgentEmailFromRequest(request);
  if (!agentEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const agent = await getAgentByEmail(agentEmail);
      return NextResponse.json({
        enabled: agent?.telegramNotificationsEnabled ?? false,
        chatId: agent?.telegramChatId ?? null,
      });
    } catch (error) {
      console.error(
        "Ошибка получения настройки Telegram-уведомлений агента:",
        error
      );
      return NextResponse.json(
        { error: "Ошибка загрузки настройки" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ enabled: false, chatId: null });
}

export async function PUT(request: NextRequest) {
  const agentEmail = getAgentEmailFromRequest(request);
  if (!agentEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 }
    );
  }

  try {
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
      await updateAgent(agentEmail, { telegramChatId: parsed.data.chatId });
      return NextResponse.json({ chatId: parsed.data.chatId });
    }

    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await updateAgent(agentEmail, {
      telegramNotificationsEnabled: parsed.data.enabled,
    });

    return NextResponse.json({ enabled: parsed.data.enabled });
  } catch (error) {
    console.error("Ошибка сохранения настройки Telegram-уведомлений:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
