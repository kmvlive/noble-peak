import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getActivityById,
  getActivityCalendar,
  setActivityCalendar,
} from "@/lib/models";
import { mockCalendars } from "@/lib/mock-data";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";
import { z } from "zod";

const calendarDateEntrySchema = z.object({
  available: z.boolean(),
  hours: z.array(z.string()).optional(),
  closed: z.boolean().optional(),
});

const setCalendarSchema = z.object({
  dates: z.record(z.string(), calendarDateEntrySchema),
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
    const parsed = setCalendarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const calendar = await setActivityCalendar(id, parsed.data.dates);
    return NextResponse.json(calendar);
  } catch (error) {
    console.error("Ошибка обновления календаря:", error);
    return NextResponse.json(
      { error: "Ошибка обновления календаря" },
      { status: 500 }
    );
  }
}
