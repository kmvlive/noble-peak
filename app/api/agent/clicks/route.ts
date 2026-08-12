import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { getAgentByCode, recordAgentClick } from "@/lib/models";

const recordClickSchema = z.object({
  code: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 }
    );
  }

  const parsed = recordClickSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const agent = await getAgentByCode(parsed.data.code);
    if (!agent) {
      return NextResponse.json({ error: "Агент не найден" }, { status: 404 });
    }

    await recordAgentClick(agent.email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to record agent click:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
