import { NextRequest, NextResponse } from "next/server";
import { getAgentByEmail, getAgentSales } from "@/lib/models";
import { getAgentEmailFromRequest } from "@/lib/agent-auth";
import { isDatabaseAvailable } from "@/lib/db";

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

    const sales = await getAgentSales(agent.email);

    return NextResponse.json({
      agent: { name: agent.name, email: agent.email, code: agent.code },
      sales,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
