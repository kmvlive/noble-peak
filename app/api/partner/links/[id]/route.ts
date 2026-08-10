import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getPartnerByEmail,
  getLinksByPartner,
  respondToPartnerLink,
  updatePartner,
} from "@/lib/models";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";

const respondSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна. Попробуйте позже." },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;

    const partner = await getPartnerByEmail(partnerEmail);
    if (!partner) {
      return NextResponse.json({ error: "Партнёр не найден" }, { status: 404 });
    }

    const links = await getLinksByPartner(partnerEmail);
    const link = links.find((l) => l.id === id);
    if (!link) {
      return NextResponse.json(
        { error: "Запрос на привязку не найден" },
        { status: 404 }
      );
    }
    if (link.status !== "pending") {
      return NextResponse.json(
        { error: "Этот запрос уже обработан" },
        { status: 409 }
      );
    }

    const body = await request.json();
    const parsed = respondSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const status = parsed.data.action === "accept" ? "accepted" : "declined";
    const updated = await respondToPartnerLink(id, status);

    if (parsed.data.action === "accept") {
      await updatePartner(partnerEmail, { agentEmail: link.agentEmail });
    }

    return NextResponse.json({ link: updated });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
