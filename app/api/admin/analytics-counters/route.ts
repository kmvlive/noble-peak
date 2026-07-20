import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getAllAnalyticsCounters,
  createAnalyticsCounter,
  deleteAnalyticsCounter,
} from "@/lib/models";
import { mockAnalyticsCounters } from "@/lib/mock-data";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

const createCounterSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  code: z.string().min(1, "Код счётчика обязателен"),
});

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.cookies.get("admin_token");
  return cookie?.value ?? null;
}

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const counters = await getAllAnalyticsCounters();
      return NextResponse.json(counters);
    } catch (error) {
      console.error("Ошибка получения счётчиков:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockAnalyticsCounters);
}

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createCounterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const counter = await createAnalyticsCounter(parsed.data);
    return NextResponse.json(counter, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания счётчика:", error);
    return NextResponse.json(
      { error: "Ошибка создания счётчика" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Не указан ID счётчика" },
        { status: 400 }
      );
    }

    await deleteAnalyticsCounter(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления счётчика:", error);
    return NextResponse.json(
      { error: "Ошибка удаления счётчика" },
      { status: 500 }
    );
  }
}
