import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getActivityById } from "@/lib/models";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const headers = {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
  };

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
      return NextResponse.json(activity, { headers });
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
  return NextResponse.json(mock, { headers });
}
