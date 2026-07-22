import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  sendChatMessage,
  getChatMessagesByOrder,
  getChatThreadsForClient,
} from "@/lib/models";
import { getClientEmailFromRequest } from "@/lib/client-auth";
import { mockChatMessages, mockOrders } from "@/lib/mock-data";
import { z } from "zod";

const sendMessageSchema = z.object({
  orderId: z.string().min(1),
  text: z.string().min(1).max(5000),
  partnerEmail: z.string().email(),
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

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    const dbAvailable = await isDatabaseAvailable();

    if (orderId) {
      if (dbAvailable) {
        const messages = await getChatMessagesByOrder(orderId);
        return NextResponse.json({ messages });
      }
      const filtered = mockChatMessages.filter((m) => m.orderId === orderId);
      return NextResponse.json({ messages: filtered });
    }

    if (dbAvailable) {
      const messages = await getChatThreadsForClient(clientEmail);
      const confirmedOrders = mockOrders
        .filter(
          (o) => o.clientEmail === clientEmail && o.status === "confirmed"
        )
        .map((o) => o.id);
      const threads = messages.filter((m) =>
        confirmedOrders.includes(m.orderId)
      );
      return NextResponse.json({ threads });
    }

    const confirmedOrderIds = mockOrders
      .filter((o) => o.clientEmail === clientEmail && o.status === "confirmed")
      .map((o) => o.id);
    const threads = mockChatMessages.filter((m) =>
      confirmedOrderIds.includes(m.orderId)
    );
    return NextResponse.json({ threads });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientEmail = getClientEmailFromRequest(request);
    if (!clientEmail) {
      return NextResponse.json(
        { error: "Необходимо авторизоваться" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { orderId, text, partnerEmail } = parsed.data;

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "База данных недоступна" },
        { status: 503 }
      );
    }

    const message = await sendChatMessage({
      orderId,
      senderEmail: clientEmail,
      senderRole: "client",
      text,
      clientEmail,
      partnerEmail,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
