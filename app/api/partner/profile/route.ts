import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { getPartnerByEmail, updatePartner, isSlugTaken } from "@/lib/models";
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
        photo: partner.photo ?? "",
        description: partner.description ?? "",
        slug: partner.slug ?? "",
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
    photo: mock.photo ?? "",
    description: mock.description ?? "",
    slug: mock.slug ?? "",
  });
}

const updateProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().min(1).max(30).optional(),
  photo: z.string().max(5000).optional(),
  description: z.string().max(50000).optional(),
  slug: z
    .string()
    .max(100)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Только латиница, цифры и дефисы")
    .optional(),
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

    if (parsed.data.slug !== undefined) {
      const taken = await isSlugTaken(parsed.data.slug, partnerEmail);
      if (taken) {
        return NextResponse.json(
          { error: "Этот slug уже занят другим партнёром" },
          { status: 409 }
        );
      }
    }

    const updated = await updatePartner(partnerEmail, parsed.data);

    return NextResponse.json({
      name: updated.name,
      phone: updated.phone,
      email: updated.email,
      photo: updated.photo ?? "",
      description: updated.description ?? "",
      slug: updated.slug ?? "",
    });
  } catch (error) {
    console.error("Ошибка обновления профиля партнёра:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
