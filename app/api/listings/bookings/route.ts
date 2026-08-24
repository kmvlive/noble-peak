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
  getListingCalendar,
  listingPriceForRange,
} from "@/lib/models";
import { createListingBookingSchema } from "@/lib/validation/listing-booking";
import {
  getClientEmailFromRequest,
  createClientToken,
} from "@/lib/client-auth";
import { mockListingBookings } from "@/lib/mock-data";
import { pushBookingToBnovo } from "@/lib/channels/bnovo";
import { createNotification } from "@/lib/models";
import { sendEmail } from "@/lib/email";
import { getMainAdminEmail } from "@/lib/auth";
import { appName } from "@/lib/app-name";

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
  const calendar = await getListingCalendar(listingId, unitId);
  if (calendar?.minNights && nights < calendar.minNights) {
    return NextResponse.json(
      {
        error: `Минимальный срок пребывания — ${calendar.minNights} ноч. Выберите более длинный период.`,
      },
      { status: 409 }
    );
  }
  const price = listingPriceForRange(
    listing,
    calendar,
    checkIn,
    checkOut,
    unitId
  );

  const booking = await createListingBooking({
    listingId,
    listingNumber: listing.listingNumber,
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

  // Отправляем бронь в подключённые каналы (Bnovo) без блокировки ответа клиенту.
  pushBookingToBnovo(booking).catch((err) =>
    console.error("Ошибка отправки брони в канал:", err)
  );

  // Уведомление партнёру о новом бронировании (на сайте + в Telegram/ВК при
  // включённых настройках).
  if (listing.partnerEmail) {
    createNotification({
      recipientEmail: listing.partnerEmail,
      type: "new_order",
      title: "Новое бронирование жилья",
      message: `Новое бронирование "${listingTitle}" с ${checkIn} по ${checkOut} от ${clientName}.`,
      link: `/partner/listings/${listingId}/calendar`,
    }).catch((e) =>
      console.error("Ошибка создания уведомления партнёру о новой брони:", e)
    );
  }

  // Администратор получает уведомление по email о новом бронировании.
  const adminEmail = getMainAdminEmail();
  await sendEmail({
    to: adminEmail,
    subject: `Новое бронирование жилья: ${listingTitle}`,
    html: `
      <h1>Новое бронирование жилья</h1>
      <p><strong>Жильё:</strong> ${listingTitle}</p>
      <p><strong>Период:</strong> с ${checkIn} по ${checkOut} (${nights} ноч.)</p>
      <p><strong>Клиент:</strong> ${clientName}</p>
      <p><strong>Телефон:</strong> ${clientPhone}</p>
      <p><strong>Email:</strong> ${clientEmail}</p>
      <p><strong>Стоимость:</strong> ${price} ₽</p>
      <hr />
      <p>ID бронирования: ${booking.id}</p>
      <p>С уважением, ${appName}.</p>
    `,
  });

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
