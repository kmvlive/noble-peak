import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  sendChatMessage,
  getChatMessagesByOrder,
  getPartnerChatThreads,
  getMockPartnerChatThreads,
} from "@/lib/models";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";
import { mockChatMessages } from "@/lib/mock-data";
import { z } from "zod";

const sendMessageSchema = z.object({
  orderId: z.string().min(1),
  text: z.string().min(1).max(5000),
  clientEmail: z.string().email(),
});

export async function GET(request: NextRequest) {
  try {
    const partnerEmail = getPartnerEmailFromRequest(request);
    if (!partnerEmail) {
      return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    const dbAvailable = await isDatabaseAvailable();

    if (orderId) {
      if (dbAvailable) {
        const messages = await getChatMessagesByOrder(orderId);
        return NextResponse.json(messages);
      }
      const filtered = mockChatMessages.filter((m) => m.orderId === orderId);
      return NextResponse.json(filtered);
    }

    if (dbAvailable) {
      const threads = await getPartnerChatThreads(partnerEmail);
      return NextResponse.json({ threads });
    }

    return NextResponse.json({
      threads: getMockPartnerChatThreads(partnerEmail),
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const partnerEmail = getPartnerEmailFromRequest(request);
    if (!partnerEmail) {
      return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { orderId, text, clientEmail } = parsed.data;

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "База данных недоступна" },
        { status: 503 }
      );
    }

    const message = await sendChatMessage({
      orderId,
      senderEmail: partnerEmail,
      senderRole: "partner",
      text,
      clientEmail,
      partnerEmail,
    });

    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
