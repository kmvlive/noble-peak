import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllActivities, createActivity } from "@/lib/models";
import { mockActivities } from "@/lib/mock-data";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";
import { sections } from "@/lib/data";

const createActivitySchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  shortDescription: z.string().max(500).optional().default(""),
  description: z.string().max(50_000).optional().default(""),
  images: z.array(z.string()).optional().default([]),
  section: z
    .string()
    .refine((val) => sections.some((s) => s.category === val), {
      message: "Некорректный раздел",
    }),
  price: z.number().min(0),
  likes: z.number().min(0).optional().default(0),
  isPopular: z.boolean().optional().default(false),
  orderType: z.enum(["payment", "order_form"]).optional().default("order_form"),
  imageGradient: z.string().optional().default("from-blue-400 to-indigo-500"),
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

    const activity = await createActivity(parsed.data);

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания активности:", error);
    return NextResponse.json(
      { error: "Ошибка создания активности" },
      { status: 500 }
    );
  }
}
