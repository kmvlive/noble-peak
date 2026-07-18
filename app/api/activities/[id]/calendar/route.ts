import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getActivityCalendar } from "@/lib/models";
import { mockCalendars } from "@/lib/mock-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const calendar = await getActivityCalendar(id);
      if (!calendar) {
        return NextResponse.json({
          activityId: id,
          dates: {},
          updatedAt: null,
        });
      }
      return NextResponse.json(calendar);
    } catch (error) {
      console.error("Ошибка получения календаря:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных календаря" },
        { status: 500 }
      );
    }
  }

  const mock = mockCalendars.find((c) => c.activityId === id);
  if (!mock) {
    return NextResponse.json({ activityId: id, dates: {}, updatedAt: null });
  }
  return NextResponse.json(mock);
}
