import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAgentByEmail, updateAgent } from "@/lib/models";
import { getAgentEmailFromRequest } from "@/lib/agent-auth";
import { isDatabaseAvailable } from "@/lib/db";

const bankDetailsSchema = z.object({
  fullName: z.string().min(1).max(300),
  bankName: z.string().min(1).max(200),
  bik: z.string().min(1).max(20),
  accountNumber: z.string().min(1).max(30),
  correspondentAccount: z.string().min(1).max(30),
  inn: z.string().max(20).optional(),
});

const updateDetailsSchema = z.object({
  bankDetails: bankDetailsSchema,
});

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

    return NextResponse.json({
      bankDetails: agent.bankDetails ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const email = getAgentEmailFromRequest(request);
    if (!email) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
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
    const parsed = updateDetailsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateAgent(email, {
      bankDetails: parsed.data.bankDetails,
    });

    return NextResponse.json({
      bankDetails: updated.bankDetails ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
