import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { getPartnerByEmail, updatePartner } from "@/lib/models";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";
import { mockPartners } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const partner = await getPartnerByEmail(partnerEmail);
      if (!partner) {
        return NextResponse.json(
          { error: "Партнёр не найден" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        name: partner.name,
        phone: partner.phone,
        email: partner.email,
      });
    } catch (error) {
      console.error("Ошибка получения профиля партнёра:", error);
      return NextResponse.json(
        { error: "Ошибка загрузки профиля" },
        { status: 500 }
      );
    }
  }

  const mock = mockPartners.find((p) => p.email === partnerEmail);
  if (!mock) {
    return NextResponse.json({ error: "Партнёр не найден" }, { status: 404 });
  }
  return NextResponse.json({
    name: mock.name,
    phone: mock.phone,
    email: mock.email,
  });
}

const updateProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().min(1).max(30).optional(),
});

export async function PATCH(request: NextRequest) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна. Попробуйте позже." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updatePartner(partnerEmail, parsed.data);

    return NextResponse.json({
      name: updated.name,
      phone: updated.phone,
      email: updated.email,
    });
  } catch (error) {
    console.error("Ошибка обновления профиля партнёра:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
