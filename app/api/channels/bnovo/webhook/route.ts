import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { handleBnovoWebhookEvent } from "@/lib/channels/bnovo";

export async function POST(request: NextRequest) {
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json({ error: "База недоступна" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Пустое событие" }, { status: 400 });
  }

  try {
    const processed = await handleBnovoWebhookEvent(body);
    return NextResponse.json({ ok: true, processed });
  } catch (error) {
    console.error("Ошибка обработки вебхука Bnovo:", error);
    return NextResponse.json(
      { error: "Ошибка обработки события" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
