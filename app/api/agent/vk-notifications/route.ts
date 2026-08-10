import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getAgentByEmail, updateAgent } from "@/lib/models";
import { getAgentEmailFromRequest } from "@/lib/agent-auth";
import { z } from "zod";

const toggleSchema = z.object({
  enabled: z.boolean(),
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
        enabled: agent?.vkNotificationsEnabled ?? false,
      });
    } catch (error) {
      console.error("Ошибка получения настройки VK-уведомлений агента:", error);
      return NextResponse.json(
        { error: "Ошибка загрузки настройки" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ enabled: false });
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
    const parsed = toggleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await updateAgent(agentEmail, {
      vkNotificationsEnabled: parsed.data.enabled,
    });

    return NextResponse.json({ enabled: parsed.data.enabled });
  } catch (error) {
    console.error("Ошибка сохранения настройки VK-уведомлений:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
