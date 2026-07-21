import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getAllReviews,
  getReviewsByStatus,
  updateReviewStatus,
} from "@/lib/models";
import { isDatabaseAvailable } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { mockReviews } from "@/lib/mock-data";

const moderateReviewSchema = z.object({
  activityId: z.string().min(1),
  id: z.string().min(1),
  status: z.enum(["approved", "rejected"]),
});

export async function GET(request: NextRequest) {
  const token =
    request.cookies.get("admin_token")?.value ??
    request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    let reviews;
    if (
      statusFilter === "pending" ||
      statusFilter === "approved" ||
      statusFilter === "rejected"
    ) {
      reviews = await getReviewsByStatus(statusFilter);
    } else {
      reviews = await getAllReviews();
    }
    return NextResponse.json(reviews);
  }

  let filtered = mockReviews;
  if (
    statusFilter === "pending" ||
    statusFilter === "approved" ||
    statusFilter === "rejected"
  ) {
    filtered = mockReviews.filter((r) => r.status === statusFilter);
  }
  return NextResponse.json(filtered);
}

export async function PATCH(request: NextRequest) {
  const token =
    request.cookies.get("admin_token")?.value ??
    request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 }
    );
  }

  const body = await request.json();
  const parsed = moderateReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { activityId, id, status } = parsed.data;

  await updateReviewStatus(activityId, id, status);

  return NextResponse.json({ success: true });
}
