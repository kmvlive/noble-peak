import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import {
  createBooking,
  updateBookingPayment,
  getActivityById,
  removeBookedSlotFromCalendar,
  createOrder,
  getClientByPhone,
  createClient,
  getClientByEmail,
} from "@/lib/models";
import {
  getClientEmailFromRequest,
  createClientToken,
} from "@/lib/client-auth";
import { initPayment, loadPaymentSettings } from "@/lib/payment";

const initPaymentSchema = z.object({
  activityId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().nullable(),
  details: z.string().max(5000).default(""),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
});

function generateGuestEmail(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  return `guest_${cleanPhone}@magazin-tour.ru`;
}

export async function POST(request: NextRequest) {
  try {
    const clientEmail = getClientEmailFromRequest(request);
    const parsed = initPaymentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "База данных недоступна. Попробуйте позже." },
        { status: 503 }
      );
    }

    const { activityId, date, time, details, clientName, clientPhone } =
      parsed.data;

    let effectiveEmail = clientEmail;
    let effectiveName = "";
    let effectivePhone = "";

    if (!effectiveEmail) {
      if (!clientName || !clientPhone) {
        return NextResponse.json(
          { error: "Необходимо авторизоваться или указать имя и телефон" },
          { status: 401 }
        );
      }

      const existingClient = await getClientByPhone(clientPhone);
      if (existingClient) {
        return NextResponse.json(
          {
            isGuestConflict: true,
            error:
              "Этот номер уже используется. Пожалуйста, авторизуйтесь для оплаты",
          },
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

      effectiveEmail = guestEmail;
      effectiveName = clientName;
      effectivePhone = clientPhone;
    } else {
      const clientRes = await fetch(`${request.nextUrl.origin}/api/client/me`, {
        headers: { cookie: request.headers.get("cookie") ?? "" },
      });
      const clientData = clientRes.ok ? await clientRes.json() : null;
      effectiveName = clientData?.client?.name ?? "";
      effectivePhone = clientData?.client?.phone ?? "";
    }

    const activity = await getActivityById(activityId);
    if (!activity) {
      return NextResponse.json(
        { error: "Активность не найдена" },
        { status: 404 }
      );
    }

    const amount = activity.partnerPrice ?? activity.price;

    const booking = await createBooking(
      {
        clientEmail: effectiveEmail,
        clientName: effectiveName,
        clientPhone: effectivePhone,
        activityId: activity.id,
        activityTitle: activity.title,
        date,
        time,
        details,
        price: amount,
      },
      true
    );

    createOrder({
      bookingId: booking.id,
      clientEmail: effectiveEmail,
      clientName: effectiveName,
      clientPhone: effectivePhone,
      activityId: activity.id,
      activityTitle: activity.title,
      partnerEmail: activity.partnerEmail ?? null,
      date,
      time,
      price: amount,
      status: booking.status,
    }).catch((e) => console.error("Ошибка создания заказа:", e));

    removeBookedSlotFromCalendar(activity.id, date, time).catch((e) =>
      console.error("Ошибка обновления календаря после бронирования:", e)
    );

    const amountKopecks = Math.round(amount * 100);
    await loadPaymentSettings();
    const baseUrl = request.nextUrl.origin;
    const tinkoffRes = await initPayment(
      booking.id,
      amountKopecks,
      activity.title,
      baseUrl
    );

    if (
      !tinkoffRes.Success ||
      !tinkoffRes.PaymentId ||
      !tinkoffRes.PaymentURL
    ) {
      return NextResponse.json(
        {
          error: tinkoffRes.Message ?? "Ошибка при создании платежа",
          errorCode: tinkoffRes.ErrorCode,
        },
        { status: 502 }
      );
    }

    await updateBookingPayment(booking.id, {
      paymentId: tinkoffRes.PaymentId,
      paymentUrl: tinkoffRes.PaymentURL,
    });

    const setPasswordToken = !clientEmail
      ? createClientToken(effectiveEmail)
      : null;

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      paymentUrl: tinkoffRes.PaymentURL,
      setPasswordToken,
      isGuest: !clientEmail,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
