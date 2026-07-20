import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getMenuItems, createMenuItem } from "@/lib/models";
import { mockMenuItems } from "@/lib/mock-data";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";
import { randomUUID } from "node:crypto";

const createMenuItemSchema = z.object({
  menuType: z.enum(["admin", "client", "partner", "footer"]),
  name: z.string().min(1).max(200),
  url: z.string().min(1).max(500),
  order: z.number().int().min(0).default(0),
});

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.cookies.get("admin_token");
  return cookie?.value ?? null;
}

export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const menuType = searchParams.get("type");

  if (
    !menuType ||
    !["admin", "client", "partner", "footer"].includes(menuType)
  ) {
    return NextResponse.json(
      { error: "Некорректный тип меню" },
      { status: 400 }
    );
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const items = await getMenuItems(
        menuType as "admin" | "client" | "partner" | "footer"
      );
      return NextResponse.json(items);
    } catch (error) {
      console.error("Ошибка получения пунктов меню:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  const filtered = mockMenuItems.filter((item) => item.menuType === menuType);
  return NextResponse.json(filtered);
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
    const parsed = createMenuItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const menuItem = await createMenuItem({
      id: randomUUID(),
      ...parsed.data,
    });

    return NextResponse.json(menuItem, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания пункта меню:", error);
    return NextResponse.json(
      { error: "Ошибка создания пункта меню" },
      { status: 500 }
    );
  }
}
