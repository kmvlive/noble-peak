import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { updateMenuItem, deleteMenuItem } from "@/lib/models";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

const updateMenuItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  url: z.string().min(1).max(500).optional(),
  order: z.number().int().min(0).optional(),
});

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.cookies.get("admin_token");
  return cookie?.value ?? null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const menuType = searchParams.get("menuType");

    if (!menuType || !["admin", "client", "partner"].includes(menuType)) {
      return NextResponse.json(
        { error: "Некорректный тип меню" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateMenuItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const menuItem = await updateMenuItem(menuType, id, parsed.data);

    return NextResponse.json(menuItem);
  } catch (error) {
    console.error("Ошибка обновления пункта меню:", error);
    return NextResponse.json(
      { error: "Ошибка обновления пункта меню" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const menuType = searchParams.get("menuType");

    if (!menuType || !["admin", "client", "partner"].includes(menuType)) {
      return NextResponse.json(
        { error: "Некорректный тип меню" },
        { status: 400 }
      );
    }

    await deleteMenuItem(menuType, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления пункта меню:", error);
    return NextResponse.json(
      { error: "Ошибка удаления пункта меню" },
      { status: 500 }
    );
  }
}
