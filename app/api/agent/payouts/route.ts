import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getAgentByEmail,
  getAgentEarnings,
  createPayout,
  getPayoutForMonth,
} from "@/lib/models";
import { getAgentEmailFromRequest } from "@/lib/agent-auth";

const createPayoutSchema = z.object({
  amount: z.number().int().min(1).max(100_000_000),
});

export async function POST(request: NextRequest) {
  try {
    const email = getAgentEmailFromRequest(request);
    if (!email) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "Сервис недоступен, попробуйте позже" },
        { status: 503 }
      );
    }

    const agent = await getAgentByEmail(email);
    if (!agent) {
      return NextResponse.json({ error: "Агент не найден" }, { status: 404 });
    }

    const parsed = createPayoutSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const existingPayout = await getPayoutForMonth(agent.email, currentMonth);
    if (existingPayout) {
      return NextResponse.json(
        { error: "Заявка на выплату уже подана в этом месяце" },
        { status: 409 }
      );
    }

    const earnings = await getAgentEarnings(agent.email);
    const amount = parsed.data.amount;
    if (amount > earnings) {
      return NextResponse.json(
        { error: "Сумма не может превышать текущий заработок" },
        { status: 400 }
      );
    }

    const payout = await createPayout({
      agentEmail: agent.email,
      agentName: agent.name,
      amount,
      month: currentMonth,
    });

    return NextResponse.json({ payout }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
