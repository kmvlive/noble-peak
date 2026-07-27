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
        legalData: partner.legalData ?? null,
      });
    } catch (error) {
      console.error("Ошибка получения юридических данных:", error);
      return NextResponse.json(
        { error: "Ошибка загрузки данных" },
        { status: 500 }
      );
    }
  }

  const mock = mockPartners.find((p) => p.email === partnerEmail);
  if (!mock) {
    return NextResponse.json({ error: "Партнёр не найден" }, { status: 404 });
  }
  return NextResponse.json({
    legalData: mock.legalData ?? null,
  });
}

const legalDataSchema = z.object({
  country: z.string().min(1).max(200),
  status: z.enum(["individual", "ip", "legal_entity"]),
  fullName: z.string().min(1).max(300),
  document: z.enum(["passport_rf", "passport_foreign"]),
  documentSeriesNumber: z.string().min(1).max(50),
  issueDate: z.string().min(1).max(20),
  tin: z.string().min(1).max(20),
});

const updateLegalSchema = z.object({
  legalData: legalDataSchema,
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
    const parsed = updateLegalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updatePartner(partnerEmail, {
      legalData: parsed.data.legalData,
    });

    return NextResponse.json({
      legalData: updated.legalData ?? null,
    });
  } catch (error) {
    console.error("Ошибка сохранения юридических данных:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
