import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getOrderedDatesByActivityId } from "@/lib/models";
import { verifyToken } from "@/lib/auth";

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.cookies.get("admin_token");
  return cookie?.value ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const { id } = await params;
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json({ dates: [] });
  }

  try {
    const dates = await getOrderedDatesByActivityId(id);
    return NextResponse.json({ dates });
  } catch (error) {
    console.error("Ошибка получения дат с заказами:", error);
    return NextResponse.json(
      { error: "Ошибка получения дат с заказами" },
      { status: 500 }
    );
  }
}
