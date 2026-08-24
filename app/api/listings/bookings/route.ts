import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getListingById,
  computeListingNights,
  isListingRangeAvailable,
  createListingBooking,
  blockListingDates,
  getListingBookingsByListing,
  getClientListingBookings,
  getClientByPhone,
  getClientByEmail,
  createClient,
} from "@/lib/models";
import { createListingBookingSchema } from "@/lib/validation/listing-booking";
import {
  getClientEmailFromRequest,
  createClientToken,
} from "@/lib/client-auth";
import { mockListingBookings } from "@/lib/mock-data";

function generateGuestEmail(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  return `guest_${cleanPhone}@magazin-tour.ru`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get("listingId");

  if (listingId) {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json({
        bookings: mockListingBookings.filter(
          (b) => b.listingId === listingId && b.status === "confirmed"
        ),
      });
    }
    try {
      const bookings = await getListingBookingsByListing(listingId);
      return NextResponse.json({
        bookings: bookings.filter((b) => b.status === "confirmed"),
      });
    } catch {
      return NextResponse.json(
        { error: "Ошибка получения броней" },
        { status: 500 }
      );
    }
  }

  const clientEmail = getClientEmailFromRequest(request);
  if (!clientEmail) {
    return NextResponse.json(
      { error: "Не указан listingId и не авторизован клиент" },
      { status: 400 }
    );
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json({
      bookings: mockListingBookings.filter(
        (b) => b.clientEmail === clientEmail
      ),
    });
  }

  try {
    const bookings = await getClientListingBookings(clientEmail);
    return NextResponse.json({ bookings });
  } catch {
    return NextResponse.json(
      { error: "Ошибка получения броней" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна. Попробуйте позже." },
      { status: 503 }
    );
  }

  const parsed = createListingBookingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    listingId,
    listingTitle,
    unitId,
    clientName,
    clientPhone,
    checkIn,
    checkOut,
  } = parsed.data;

  const listing = await getListingById(listingId);
  if (!listing || listing.status !== "active") {
    return NextResponse.json(
      { error: "Объявление не найдено или недоступно" },
      { status: 404 }
    );
  }

  let clientEmail = getClientEmailFromRequest(request);
  if (!clientEmail) {
    const existingClient = await getClientByPhone(clientPhone);
    if (existingClient) {
      return NextResponse.json(
        { error: "Этот номер уже используется. Пожалуйста, авторизуйтесь." },
        { status: 409 }
      );
    }
    const guestEmail = generateGuestEmail(clientPhone);
    const existingGuest = await getClientByEmail(guestEmail);
    if (!existingGuest) {
      await createClient({
        email: guestEmail,
        name: clientName,
        phone: clientPhone,
        passwordHash: "",
      });
    }
    clientEmail = guestEmail;
  }

  const availability = await isListingRangeAvailable(
    listingId,
    unitId,
    checkIn,
    checkOut
  );

  if (!availability.available) {
    const reason =
      availability.reason === "closed"
        ? "закрыта владельцем"
        : "уже забронирована";
    return NextResponse.json(
      {
        error: `Диапазон дат недоступен: дата ${availability.conflictDate} ${reason}. Выберите другие даты.`,
      },
      { status: 409 }
    );
  }

  const nights = computeListingNights(checkIn, checkOut);
  const price = listing.price * nights;

  const booking = await createListingBooking({
    listingId,
    listingTitle,
    unitId,
    clientEmail,
    clientName,
    clientPhone,
    checkIn,
    checkOut,
    nights,
    price,
    status: "confirmed",
  });

  await blockListingDates(listingId, unitId, checkIn, checkOut);

  const setPasswordToken = !getClientEmailFromRequest(request)
    ? createClientToken(clientEmail)
    : null;

  return NextResponse.json(
    {
      success: true,
      booking,
      nights,
      price,
      setPasswordToken,
      isGuest: !getClientEmailFromRequest(request),
    },
    { status: 201 }
  );
}

export const dynamic = "force-dynamic";
