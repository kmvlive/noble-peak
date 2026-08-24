import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getListingById,
  getListingCalendarUnits,
  getListingCalendars,
  setListingCalendar,
  setListingMinNights,
  setListingPrices,
  reblockListingBookedDates,
  getListingBookingsByListing,
} from "@/lib/models";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";
import {
  listingCalendarDatesSchema,
  listingCalendarPricesSchema,
} from "@/lib/validation/listing-calendar";
import { mockListings, mockListingCalendars } from "@/lib/mock-data";

const saveCalendarSchema = z.object({
  unitId: z.string().min(1).max(200),
  dates: listingCalendarDatesSchema.optional(),
  prices: listingCalendarPricesSchema.optional(),
  minNights: z.number().int().min(1).max(365).nullable().optional(),
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

  if (!dbAvailable) {
    const mock = mockListings.find(
      (l) => l.id === id && l.partnerEmail === partnerEmail
    );
    if (!mock) {
      return NextResponse.json(
        { error: "Объявление не найдено" },
        { status: 404 }
      );
    }
    const units = getListingCalendarUnits(mock);
    return NextResponse.json({
      listing: mock,
      units,
      calendars: mockListingCalendars.filter((c) => c.listingId === id),
      bookings: [],
    });
  }

  try {
    const listing = await getListingById(id);
    if (!listing || listing.partnerEmail !== partnerEmail) {
      return NextResponse.json(
        { error: "Объявление не найдено" },
        { status: 404 }
      );
    }

    const [calendars, bookings] = await Promise.all([
      getListingCalendars(id),
      getListingBookingsByListing(id),
    ]);

    return NextResponse.json({
      listing,
      units: getListingCalendarUnits(listing),
      calendars,
      bookings: bookings.filter((b) => b.status === "confirmed"),
    });
  } catch (error) {
    console.error("Ошибка получения календаря объявления:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки календаря" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;
    const listing = await getListingById(id);
    if (!listing || listing.partnerEmail !== partnerEmail) {
      return NextResponse.json(
        { error: "Объявление не найдено" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = saveCalendarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { unitId, dates, prices, minNights } = parsed.data;

    if (prices !== undefined) {
      await setListingPrices(id, unitId, prices);
    }
    if (minNights !== undefined) {
      await setListingMinNights(id, unitId, minNights ?? 0);
    }
    if (dates !== undefined) {
      await setListingCalendar(id, unitId, dates);
    }

    const calendar = await reblockListingBookedDates(id, unitId);
    return NextResponse.json(calendar);
  } catch (error) {
    console.error("Ошибка сохранения календаря объявления:", error);
    return NextResponse.json(
      { error: "Ошибка сохранения календаря" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
