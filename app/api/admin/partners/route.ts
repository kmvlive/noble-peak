import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllPartners, updatePartner, getPartnerByEmail } from "@/lib/models";
import { mockPartners } from "@/lib/mock-data";
import { verifyToken, isMainAdminPayload } from "@/lib/auth";
import { z } from "zod";

const updatePartnerSchema = z.object({
  email: z.string().email(),
  orderFormEnabled: z.boolean(),
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

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const partners = await getAllPartners();
      return NextResponse.json(partners);
    } catch (error) {
      console.error("Ошибка получения партнёров:", error);
      return NextResponse.json(
        { error: "Ошибка загрузки партнёров" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockPartners);
}

export async function PUT(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || !isMainAdminPayload(payload)) {
    return NextResponse.json(
      {
        error:
          "Только главный администратор может изменять настройки партнёров",
      },
      { status: 403 }
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
    const body = await request.json();
    const parsed = updatePartnerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, orderFormEnabled } = parsed.data;

    const existing = await getPartnerByEmail(email);
    if (!existing) {
      return NextResponse.json({ error: "Партнёр не найден" }, { status: 404 });
    }

    const updated = await updatePartner(email, { orderFormEnabled });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Ошибка обновления партнёра:", error);
    return NextResponse.json(
      { error: "Ошибка обновления партнёра" },
      { status: 500 }
    );
  }
}
