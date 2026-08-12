import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getAgentByEmail,
  getAgentClicks30,
  getAgentRegistrations30,
  getAgentEarnings,
  getInfoPagesByTarget,
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

    const stats = dbAvailable
      ? {
          clicks30: await getAgentClicks30(agent.email),
          registrations30: await getAgentRegistrations30(agent.email),
          earnings: await getAgentEarnings(agent.email),
        }
      : {
          clicks30: await getAgentClicks30(agent.email),
          registrations30: 0,
          earnings: 0,
        };

    const articles = dbAvailable ? await getInfoPagesByTarget("agent") : [];

    return NextResponse.json({
      agent: {
        name: agent.name,
        phone: agent.phone,
        email: agent.email,
        code: agent.code,
      },
      stats,
      articles,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
