import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getAgentByEmail, getPartnersByAgent } from "@/lib/models";
import { getAgentEmailFromRequest } from "@/lib/agent-auth";

export async function GET(request: NextRequest) {
  try {
    const email = getAgentEmailFromRequest(request);
    if (!email) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const dbAvailable = await isDatabaseAvailable();

    const agent = dbAvailable ? await getAgentByEmail(email) : null;
    if (!agent) {
      return NextResponse.json({ error: "Агент не найден" }, { status: 404 });
    }

    const partners = await getPartnersByAgent(agent.email);

    return NextResponse.json({
      partners: partners.map((p) => ({
        email: p.email,
        name: p.name,
        phone: p.phone,
        photo: p.photo,
        createdAt: p.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
