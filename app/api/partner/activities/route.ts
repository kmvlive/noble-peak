import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getActivitiesByPartnerEmail,
  createActivity,
  getOrderSettings,
  getPartnerByEmail,
} from "@/lib/models";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";
import { mockPartnerActivities } from "@/lib/mock-data";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const createPartnerActivitySchema = z.object({
  title: z.string().min(1).max(200),
  shortDescription: z.string().max(500).optional().default(""),
  description: z.string().max(50_000).optional().default(""),
  images: z.array(z.string()).optional().default([]),
  section: z.string().min(1, "Раздел обязателен"),
  price: z.number().min(0),
  over18: z.boolean().optional().default(false),
  activityType: z
    .enum(["individual", "group"])
    .optional()
    .default("individual"),
  orderType: z.enum(["payment", "order_form"]).optional().default("order_form"),
  imageGradient: z.string().optional().default("from-blue-400 to-indigo-500"),
  isMultiDay: z.boolean().optional().default(false),
  location: z.string().max(200).optional().default(""),
  languages: z
    .array(z.string().min(1).max(40))
    .max(20)
    .optional()
    .default(["ru"]),
});

export async function GET(request: NextRequest) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const activities = await getActivitiesByPartnerEmail(partnerEmail);
      return NextResponse.json(activities);
    } catch (error) {
      console.error("Ошибка получения активностей партнёра:", error);
      return NextResponse.json(
        { error: "Ошибка загрузки активностей" },
        { status: 500 }
      );
    }
  }

  const filtered = mockPartnerActivities.filter(
    (a) => a.partnerEmail === partnerEmail
  );
  return NextResponse.json(filtered);
}

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

    const orderSettings = await getOrderSettings();
    const globalOrderFormEnabled = orderSettings?.orderFormEnabled ?? true;

    const partner = await getPartnerByEmail(partnerEmail);
    const partnerOrderFormEnabled = partner?.orderFormEnabled ?? true;

    const canUseOrderForm = globalOrderFormEnabled || partnerOrderFormEnabled;

    const id = slugify(parsed.data.title) || "activity";

    const activity = await createActivity({
      ...parsed.data,
      id,
      likes: 0,
      isPopular: false,
      partnerEmail,
      status: "pending",
      orderType: canUseOrderForm ? parsed.data.orderType : "payment",
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания активности:", error);
    return NextResponse.json(
      { error: "Ошибка создания активности" },
      { status: 500 }
    );
  }
}
