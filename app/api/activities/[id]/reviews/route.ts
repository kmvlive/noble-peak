import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getApprovedReviewsByActivity,
  createReview,
  getActivityById,
} from "@/lib/models";
import { isDatabaseAvailable } from "@/lib/db";
import { getClientEmailFromRequest } from "@/lib/client-auth";
import { getClientByEmail } from "@/lib/models";
import { mockReviews } from "@/lib/mock-data";

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1).max(2000),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    const reviews = await getApprovedReviewsByActivity(id);
    const total = reviews.length;
    const averageRating =
      total > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) /
          10
        : 0;

    return NextResponse.json({ reviews, averageRating, total });
  }

  const filtered = mockReviews.filter(
    (r) => r.activityId === id && r.status === "approved"
  );
  const total = filtered.length;
  const averageRating =
    total > 0
      ? Math.round((filtered.reduce((s, r) => s + r.rating, 0) / total) * 10) /
        10
      : 0;

  return NextResponse.json({ reviews: filtered, averageRating, total });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 }
    );
  }

  const clientEmail = getClientEmailFromRequest(request);
  if (!clientEmail) {
    return NextResponse.json(
      { error: "Необходимо авторизоваться" },
      { status: 401 }
    );
  }

  const activity = await getActivityById(id);
  if (!activity) {
    return NextResponse.json(
      { error: "Активность не найдена" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const client = await getClientByEmail(clientEmail);
  const clientName = client?.name ?? clientEmail;

  const review = await createReview({
    activityId: id,
    clientEmail,
    clientName,
    rating: parsed.data.rating,
    text: parsed.data.text,
  });

  return NextResponse.json(review, { status: 201 });
}
