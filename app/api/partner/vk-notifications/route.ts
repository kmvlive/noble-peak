import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getPartnerByEmail, updatePartner } from "@/lib/models";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";
import { z } from "zod";

const toggleSchema = z.object({
  enabled: z.boolean(),
});

export async function GET(request: NextRequest) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const partner = await getPartnerByEmail(partnerEmail);
      return NextResponse.json({
        enabled: partner?.vkNotificationsEnabled ?? false,
      });
    } catch (error) {
      console.error(
        "Ошибка получения настройки VK-уведомлений партнёра:",
        error
      );
      return NextResponse.json(
        { error: "Ошибка загрузки настройки" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ enabled: false });
}

export async function PUT(request: NextRequest) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
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
    const parsed = toggleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await updatePartner(partnerEmail, {
      vkNotificationsEnabled: parsed.data.enabled,
    });

    return NextResponse.json({ enabled: parsed.data.enabled });
  } catch (error) {
    console.error("Ошибка сохранения настройки VK-уведомлений:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
