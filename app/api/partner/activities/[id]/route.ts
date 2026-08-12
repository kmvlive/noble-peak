import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getActivityById, updateActivity } from "@/lib/models";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";
import { mockPartnerActivities } from "@/lib/mock-data";
import { z } from "zod";

const updatePartnerActivitySchema = z.object({
  title: z.string().min(1).max(200),
  shortDescription: z.string().max(500).optional(),
  description: z.string().max(50_000).optional(),
  images: z.array(z.string()).optional(),
  section: z.string().min(1, "Раздел обязателен"),
  price: z.number().min(0),
  over18: z.boolean().optional(),
  activityType: z.enum(["individual", "group"]).optional(),
  imageGradient: z.string().optional(),
  isMultiDay: z.boolean().optional(),
  location: z.string().max(200).optional(),
  languages: z.array(z.string().min(1).max(40)).max(20).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const { id } = await params;

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const activity = await getActivityById(id);
      if (!activity || activity.partnerEmail !== partnerEmail) {
        return NextResponse.json(
          { error: "Активность не найдена" },
          { status: 404 }
        );
      }
      return NextResponse.json(activity);
    } catch (error) {
      console.error("Ошибка получения активности:", error);
      return NextResponse.json(
        { error: "Ошибка загрузки активности" },
        { status: 500 }
      );
    }
  }

  const mock = mockPartnerActivities.find(
    (a) => a.id === id && a.partnerEmail === partnerEmail
  );
  if (!mock) {
    return NextResponse.json(
      { error: "Активность не найдена" },
      { status: 404 }
    );
  }
  return NextResponse.json(mock);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const activity = await getActivityById(id);
    if (!activity || activity.partnerEmail !== partnerEmail) {
      return NextResponse.json(
        { error: "Активность не найдена" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updatePartnerActivitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateActivity(id, parsed.data);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Ошибка обновления активности:", error);
    return NextResponse.json(
      { error: "Ошибка обновления активности" },
      { status: 500 }
    );
  }
}
