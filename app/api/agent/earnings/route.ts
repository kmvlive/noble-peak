import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getAgentByEmail,
  getAgentEarnings,
  getAgentEarningsByMonth,
  getPayoutsByAgent,
  getPayoutForMonth,
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

    const [totalEarnings, monthly, payouts] = await Promise.all([
      getAgentEarnings(agent.email),
      getAgentEarningsByMonth(agent.email),
      getPayoutsByAgent(agent.email),
    ]);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const existingPayout = await getPayoutForMonth(agent.email, currentMonth);

    return NextResponse.json({
      agent: { name: agent.name, email: agent.email, code: agent.code },
      totalEarnings,
      monthly,
      payouts,
      currentMonth,
      canRequest: !existingPayout,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
