import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getAllActivities,
  createActivity,
  getOrderSettings,
} from "@/lib/models";
import { mockActivities } from "@/lib/mock-data";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

const createActivitySchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  shortDescription: z.string().max(500).optional().default(""),
  description: z.string().max(50_000).optional().default(""),
  images: z.array(z.string()).optional().default([]),
  section: z.string().min(1, "Раздел обязателен"),
  price: z.number().min(0),
  partnerPrice: z.number().min(0).optional(),
  likes: z.number().min(0).optional().default(0),
  isPopular: z.boolean().optional().default(false),
  over18: z.boolean().optional().default(false),
  activityType: z
    .enum(["individual", "group"])
    .optional()
    .default("individual"),
  orderType: z.enum(["payment", "order_form"]).optional().default("order_form"),
  imageGradient: z.string().optional().default("from-blue-400 to-indigo-500"),
  isMultiDay: z.boolean().optional().default(false),
  location: z.string().max(200).optional().default(""),
  status: z
    .enum(["active", "pending", "rejected"])
    .optional()
    .default("active"),
});

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.cookies.get("admin_token");
  return cookie?.value ?? null;
}

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const activities = await getAllActivities();
      return NextResponse.json(activities);
    } catch (error) {
      console.error("Ошибка получения активностей:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockActivities);
}

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const parsed = createActivitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const orderSettings = await getOrderSettings();
    const orderFormEnabled = orderSettings?.orderFormEnabled ?? true;

    const data = {
      ...parsed.data,
      orderType: orderFormEnabled ? parsed.data.orderType : "payment",
    };

    const activity = await createActivity(data);

    revalidateTag("activities", "max");

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания активности:", error);
    return NextResponse.json(
      { error: "Ошибка создания активности" },
      { status: 500 }
    );
  }
}
