import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllInfoPages, createInfoPage } from "@/lib/models";
import { mockInfoPages } from "@/lib/mock-data";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.cookies.get("admin_token");
  return cookie?.value ?? null;
}

const createInfoPageSchema = z.object({
  target: z.enum(["partner", "tourist", "agent"]),
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(50000),
});

export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const pages = await getAllInfoPages();
      return NextResponse.json(pages);
    } catch {
      return NextResponse.json(
        { error: "Ошибка загрузки страниц" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockInfoPages);
}

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createInfoPageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 }
    );
  }

  try {
    const page = await createInfoPage({
      id: crypto.randomUUID(),
      ...parsed.data,
    });
    return NextResponse.json(page, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Ошибка создания страницы" },
      { status: 500 }
    );
  }
}
