import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getActivitiesByPartnerEmail,
  getBookingById,
  deleteBooking,
  createNotification,
  updateOrderStatusByBookingId,
  updateBookingStatus,
} from "@/lib/models";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна. Попробуйте позже." },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  try {
    const booking = await getBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    const activities = await getActivitiesByPartnerEmail(partnerEmail);
    const ownsActivity = activities.some((a) => a.id === booking.activityId);
    if (!ownsActivity) {
      return NextResponse.json(
        { error: "Нет доступа к этому заказу" },
        { status: 403 }
      );
    }

    await updateBookingStatus(booking.id, "completed");
    await updateOrderStatusByBookingId(booking.id, "completed");

    createNotification({
      recipientEmail: booking.clientEmail,
      type: "booking_status",
      title: "Активность исполнена",
      message: `Заказ на "${booking.activityTitle}" на ${booking.date}${booking.time ? ` в ${booking.time}` : " (весь день)"} исполнен партнёром.`,
      link: `/client/bookings`,
    }).catch((e) => console.error("Ошибка создания уведомления клиенту:", e));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка подтверждения заказа партнёром:", error);
    return NextResponse.json(
      { error: "Ошибка подтверждения заказа" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна. Попробуйте позже." },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  try {
    const booking = await getBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    const activities = await getActivitiesByPartnerEmail(partnerEmail);
    const ownsActivity = activities.some((a) => a.id === booking.activityId);
    if (!ownsActivity) {
      return NextResponse.json(
        { error: "Нет доступа к этому заказу" },
        { status: 403 }
      );
    }

    await deleteBooking(booking.id);

    createNotification({
      recipientEmail: booking.clientEmail,
      type: "booking_status",
      title: "Заказ удалён",
      message: `Партнёр удалил ваш заказ на "${booking.activityTitle}" на ${booking.date}${booking.time ? ` в ${booking.time}` : " (весь день)"}.`,
      link: `/client/bookings`,
    }).catch((e) =>
      console.error("Ошибка создания уведомления клиенту об удалении:", e)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления заказа партнёром:", error);
    return NextResponse.json(
      { error: "Ошибка удаления заказа" },
      { status: 500 }
    );
  }
}
