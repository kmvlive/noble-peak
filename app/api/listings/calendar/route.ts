import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getListingCalendar,
  getListingCalendars,
  setListingCalendar,
  setListingDateStatus,
} from "@/lib/models";
import {
  setListingCalendarSchema,
  setListingDateStatusSchema,
} from "@/lib/validation/listing-calendar";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get("listingId");
  const unitId = searchParams.get("unitId");

  if (!listingId) {
    return NextResponse.json(
      { error: "listingId обязателен" },
      { status: 400 }
    );
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    if (unitId) {
      const calendar = await getListingCalendar(listingId, unitId);
      return NextResponse.json(calendar ?? { listingId, unitId, dates: {} });
    }

    const calendars = await getListingCalendars(listingId);
    return NextResponse.json(calendars);
  } catch (error) {
    console.error("Ошибка получения календаря объявления:", error);
    return NextResponse.json(
      { error: "Ошибка получения данных из DynamoDB" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = setListingCalendarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { listingId, unitId, dates } = parsed.data;
    const calendar = await setListingCalendar(listingId, unitId, dates);
    return NextResponse.json(calendar);
  } catch (error) {
    console.error("Ошибка сохранения календаря объявления:", error);
    return NextResponse.json(
      { error: "Ошибка сохранения календаря объявления" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = setListingDateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { listingId, unitId, date, status } = parsed.data;
    const calendar = await setListingDateStatus(
      listingId,
      unitId,
      date,
      status
    );
    return NextResponse.json(calendar);
  } catch (error) {
    console.error("Ошибка обновления статуса даты:", error);
    return NextResponse.json(
      { error: "Ошибка обновления статуса даты" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
