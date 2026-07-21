import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import {
  createBooking,
  updateBookingPayment,
  getActivityById,
  removeBookedSlotFromCalendar,
  createOrder,
} from "@/lib/models";
import { getClientEmailFromRequest } from "@/lib/client-auth";
import { initPayment } from "@/lib/payment";

const initPaymentSchema = z.object({
  activityId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().nullable(),
  details: z.string().max(5000).default(""),
});

export async function POST(request: NextRequest) {
  try {
    const clientEmail = getClientEmailFromRequest(request);
    if (!clientEmail) {
      return NextResponse.json(
        { error: "Необходимо авторизоваться" },
        { status: 401 }
      );
    }

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

    const { activityId, date, time, details } = parsed.data;

    const activity = await getActivityById(activityId);
    if (!activity) {
      return NextResponse.json(
        { error: "Активность не найдена" },
        { status: 404 }
      );
    }

    const clientRes = await fetch(`${request.nextUrl.origin}/api/client/me`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    });
    const clientData = clientRes.ok ? await clientRes.json() : null;
    const clientName = clientData?.client?.name ?? "";
    const clientPhone = clientData?.client?.phone ?? "";

    const amount = activity.partnerPrice ?? activity.price;

    const booking = await createBooking(
      {
        clientEmail,
        clientName,
        clientPhone,
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
      clientEmail,
      clientName,
      clientPhone,
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
    const tinkoffRes = await initPayment(
      booking.id,
      amountKopecks,
      activity.title
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

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      paymentUrl: tinkoffRes.PaymentURL,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
