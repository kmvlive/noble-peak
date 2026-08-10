import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getAgentByEmail } from "@/lib/models";
import { getAgentEmailFromRequest } from "@/lib/agent-auth";

export async function GET(request: NextRequest) {
  try {
    const email = getAgentEmailFromRequest(request);
    if (!email) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "База данных недоступна" },
        { status: 503 }
      );
    }

    const agent = await getAgentByEmail(email);
    if (!agent) {
      return NextResponse.json({ error: "Агент не найден" }, { status: 404 });
    }

    return NextResponse.json({
      agent: {
        name: agent.name,
        phone: agent.phone,
        email: agent.email,
        code: agent.code,
      },
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
