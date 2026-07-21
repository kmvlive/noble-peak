import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { updateSliderImagePosition } from "@/lib/models";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

const updatePositionSchema = z.object({
  position: z.enum(["center", "top", "bottom"]),
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
    const body = await request.json();
    const parsed = updatePositionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await updateSliderImagePosition(id, parsed.data.position);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка обновления позиции изображения:", error);
    return NextResponse.json(
      { error: "Ошибка обновления позиции" },
      { status: 500 }
    );
  }
}
