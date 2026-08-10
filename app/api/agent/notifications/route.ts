import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getNotificationsByRecipient,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/models";
import { getAgentEmailFromRequest } from "@/lib/agent-auth";
import { mockNotifications } from "@/lib/mock-data";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const agentEmail = getAgentEmailFromRequest(request);
  if (!agentEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const notifications = await getNotificationsByRecipient(agentEmail);
      return NextResponse.json(notifications);
    } catch (error) {
      console.error("Ошибка получения уведомлений агента:", error);
      return NextResponse.json(
        { error: "Ошибка загрузки уведомлений" },
        { status: 500 }
      );
    }
  }

  const filtered = mockNotifications.filter(
    (n) => n.recipientEmail === agentEmail
  );
  return NextResponse.json(filtered);
}

const markReadSchema = z.object({
  id: z.string().min(1).optional(),
});

export async function PATCH(request: NextRequest) {
  const agentEmail = getAgentEmailFromRequest(request);
  if (!agentEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json({ success: true });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = markReadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные" },
        { status: 400 }
      );
    }

    if (parsed.data.id) {
      await markNotificationRead(parsed.data.id);
    } else {
      await markAllNotificationsRead(agentEmail);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка отметки уведомлений:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
