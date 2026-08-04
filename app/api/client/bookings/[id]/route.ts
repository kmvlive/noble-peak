import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getBookingById,
  deleteBooking,
  getActivityById,
  createNotification,
  getOrdersByBookingIds,
} from "@/lib/models";
import { getClientEmailFromRequest } from "@/lib/client-auth";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const clientEmail = getClientEmailFromRequest(request);
  if (!clientEmail) {
    return NextResponse.json(
      { error: "Необходимо авторизоваться" },
      { status: 401 }
    );
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

    if (booking.clientEmail !== clientEmail) {
      return NextResponse.json(
        { error: "Нет доступа к этому заказу" },
        { status: 403 }
      );
    }

    const orders = await getOrdersByBookingIds([booking.id]);
    const order = orders.find((o) => o.bookingId === booking.id);
    if (order && (order.status === "paid" || order.status === "completed")) {
      return NextResponse.json(
        {
          error:
            "Оплаченный заказ нельзя удалить. Для отмены обратитесь к администратору.",
        },
        { status: 409 }
      );
    }

    await deleteBooking(booking.id);

    const activity = await getActivityById(booking.activityId);
    if (activity?.partnerEmail) {
      createNotification({
        recipientEmail: activity.partnerEmail,
        type: "booking_status",
        title: "Заказ удалён",
        message: `Клиент удалил заказ на "${booking.activityTitle}" на ${booking.date}${booking.time ? ` в ${booking.time}` : " (весь день)"}.`,
        link: `/partner/orders`,
      }).catch((e) =>
        console.error("Ошибка создания уведомления партнёру об удалении:", e)
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления заказа клиентом:", error);
    return NextResponse.json(
      { error: "Ошибка удаления заказа" },
      { status: 500 }
    );
  }
}
