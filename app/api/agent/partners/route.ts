import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getAgentByEmail,
  getPartnersByAgent,
  getPartnerSalesLastMonth,
} from "@/lib/models";
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

    const salesByEmail: Record<string, number> = {};
    for (const p of partners) {
      salesByEmail[p.email] = await getPartnerSalesLastMonth(p.email);
    }

    return NextResponse.json({
      partners: partners.map((p) => ({
        email: p.email,
        name: p.name,
        phone: p.phone,
        photo: p.photo,
        partnerNumber: p.partnerNumber ?? "",
        createdAt: p.createdAt,
        salesLastMonth: salesByEmail[p.email] ?? 0,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
