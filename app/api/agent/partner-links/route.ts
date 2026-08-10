import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getAgentByEmail,
  getPartnerByEmail,
  getPartnerByNumber,
  getLinksByAgent,
  createPartnerLink,
} from "@/lib/models";
import { getAgentEmailFromRequest } from "@/lib/agent-auth";

const createLinkSchema = z.object({
  partnerNumber: z.string().min(1, "Укажите номер партнёра").max(20),
});

export async function GET(request: NextRequest) {
  try {
    const email = getAgentEmailFromRequest(request);
    if (!email) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    if (!(await isDatabaseAvailable())) {
      return NextResponse.json({ links: [] });
    }

    const agent = await getAgentByEmail(email);
    if (!agent) {
      return NextResponse.json({ error: "Агент не найден" }, { status: 404 });
    }

    const links = await getLinksByAgent(agent.email);
    return NextResponse.json({ links });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const email = getAgentEmailFromRequest(request);
    if (!email) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    if (!(await isDatabaseAvailable())) {
      return NextResponse.json(
        { error: "База данных недоступна. Попробуйте позже." },
        { status: 503 }
      );
    }

    const agent = await getAgentByEmail(email);
    if (!agent) {
      return NextResponse.json({ error: "Агент не найден" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const partner = await getPartnerByNumber(parsed.data.partnerNumber);
    if (!partner) {
      return NextResponse.json(
        { error: "Партнёр с таким номером не найден" },
        { status: 404 }
      );
    }

    if (partner.agentEmail === agent.email) {
      return NextResponse.json(
        { error: "Этот партнёр уже привязан к вам" },
        { status: 409 }
      );
    }

    const existingLinks = await getLinksByAgent(agent.email);
    const pendingOrAccepted = existingLinks.find(
      (l) =>
        l.partnerEmail === partner.email &&
        (l.status === "pending" || l.status === "accepted")
    );
    if (pendingOrAccepted) {
      return NextResponse.json(
        { error: "Запрос на привязку этого партнёра уже отправлен" },
        { status: 409 }
      );
    }

    const link = await createPartnerLink({
      agentEmail: agent.email,
      agentName: agent.name,
      partnerEmail: partner.email,
      partnerName: partner.name,
    });

    return NextResponse.json({ link }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
