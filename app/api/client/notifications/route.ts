import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getNotificationsByRecipient,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/models";
import { getClientEmailFromRequest } from "@/lib/client-auth";
import { mockNotifications } from "@/lib/mock-data";
import { z } from "zod";

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
      const filtered = mockNotifications.filter(
        (n) => n.recipientEmail === clientEmail
      );
      return NextResponse.json({ notifications: filtered });
    }

    const notifications = await getNotificationsByRecipient(clientEmail);
    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

const markReadSchema = z.object({
  id: z.string().min(1).optional(),
});

export async function PATCH(request: NextRequest) {
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
      return NextResponse.json({ success: true });
    }

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
      await markAllNotificationsRead(clientEmail);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
