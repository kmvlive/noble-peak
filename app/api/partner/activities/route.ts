import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { createActivity } from "@/lib/models";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const createPartnerActivitySchema = z.object({
  title: z.string().min(1, "Название обязательно").max(200),
  shortDescription: z.string().max(500).optional().default(""),
  description: z.string().max(50_000).optional().default(""),
  images: z.array(z.string()).optional().default([]),
  section: z.string().min(1, "Раздел обязателен"),
  price: z.number().min(0, "Цена должна быть положительным числом"),
  over18: z.boolean().optional().default(false),
  imageGradient: z.string().optional().default("from-blue-400 to-indigo-500"),
  location: z.string().max(200).optional().default(""),
});

export async function POST(request: NextRequest) {
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
    const parsed = createPartnerActivitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const id = slugify(parsed.data.title) || `activity-${Date.now()}`;

    const activity = await createActivity({
      id,
      title: parsed.data.title,
      shortDescription: parsed.data.shortDescription,
      description: parsed.data.description,
      images: parsed.data.images,
      section: parsed.data.section,
      price: parsed.data.price,
      likes: 0,
      isPopular: false,
      over18: parsed.data.over18,
      orderType: "order_form",
      imageGradient: parsed.data.imageGradient,
      location: parsed.data.location,
      status: "pending",
      partnerEmail,
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания активности партнёром:", error);
    return NextResponse.json(
      { error: "Ошибка создания активности" },
      { status: 500 }
    );
  }
}
