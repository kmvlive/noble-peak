import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getActivityById,
  updateActivity,
  deleteActivity,
  getPartnerByEmail,
  getAgentCommissionRateForMonth,
} from "@/lib/models";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

const updateActivitySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().max(50_000).optional(),
  images: z.array(z.string()).optional(),
  section: z.string().min(1, "Раздел обязателен").optional(),
  price: z.number().min(0).optional(),
  partnerPrice: z.number().min(0).optional(),
  partnerPricePercent: z.number().min(0).max(100).optional(),
  likes: z.number().min(0).optional(),
  isPopular: z.boolean().optional(),
  isPromo: z.boolean().optional(),
  over18: z.boolean().optional(),
  activityType: z.enum(["individual", "group"]).optional(),
  orderType: z.enum(["payment", "order_form"]).optional(),
  imageGradient: z.string().optional(),
  isMultiDay: z.boolean().optional(),
  location: z.string().max(200).optional(),
  languages: z.array(z.string().min(1).max(40)).max(20).optional(),
  status: z.enum(["active", "pending", "rejected"]).optional(),
});

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.cookies.get("admin_token");
  return cookie?.value ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const activity = await getActivityById(id);
      if (!activity) {
        return NextResponse.json(
          { error: "Активность не найдена" },
          { status: 404 }
        );
      }
      return NextResponse.json(activity);
    } catch (error) {
      console.error("Ошибка получения активности:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  const { mockActivities } = await import("@/lib/mock-data");
  const mock = mockActivities.find((a) => a.id === id);
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
    const { id } = await params;
    const body = await request.json();
    const parsed = updateActivitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updateData = { ...parsed.data };

    if (
      updateData.status === "active" &&
      updateData.partnerPricePercent !== undefined
    ) {
      const current = await getActivityById(id);
      if (current) {
        let effectivePercent = updateData.partnerPricePercent;

        if (current.partnerEmail) {
          const partner = await getPartnerByEmail(current.partnerEmail);
          if (partner?.agentEmail) {
            const rate = await getAgentCommissionRateForMonth(
              partner.agentEmail
            );
            effectivePercent = Math.max(
              0,
              effectivePercent - Math.round(rate * 100)
            );
            updateData.partnerPricePercent = effectivePercent;
          }
        }

        updateData.partnerPrice = Math.round(
          current.price * (effectivePercent / 100)
        );
      }
    }

    const activity = await updateActivity(id, updateData);
    revalidateTag("activities", "max");
    return NextResponse.json(activity);
  } catch (error) {
    console.error("Ошибка обновления активности:", error);
    return NextResponse.json(
      { error: "Ошибка обновления активности" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    await deleteActivity(id);
    revalidateTag("activities", "max");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления активности:", error);
    return NextResponse.json(
      { error: "Ошибка удаления активности" },
      { status: 500 }
    );
  }
}
