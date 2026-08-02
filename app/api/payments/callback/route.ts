import { NextRequest, NextResponse } from "next/server";
import {
  verifyNotificationToken,
  isPaymentSuccessful,
  isPaymentFailed,
  loadPaymentSettings,
} from "@/lib/payment";
import {
  getBookingById,
  confirmBookingPayment,
  createNotification,
  failBookingPayment,
  getActivityById,
} from "@/lib/models";
import { sendEmail } from "@/lib/email";
import { getMainAdminEmail } from "@/lib/auth";
import { appName } from "@/lib/app-name";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { Token, PaymentId, OrderId, Status } = body;

    if (!Token || !PaymentId || !OrderId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const params = { ...body };
    delete params.Token;

    await loadPaymentSettings();

    if (!verifyNotificationToken(params, Token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    const booking = await getBookingById(OrderId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (isPaymentSuccessful(Status)) {
      await confirmBookingPayment(booking.id, Status);

      const activity = await getActivityById(booking.activityId);

      createNotification({
        recipientEmail: booking.clientEmail,
        type: "booking_status",
        title: "Бронирование оплачено",
        message: `Ваше бронирование на "${booking.activityTitle}" оплачено.`,
        link: `/client/bookings/${booking.id}`,
      }).catch((e) => console.error("Ошибка создания уведомления клиенту:", e));

      const partnerEmail = activity?.partnerEmail;
      if (partnerEmail) {
        createNotification({
          recipientEmail: partnerEmail,
          type: "new_order",
          title: "Новый оплаченный заказ",
          message: `Новый оплаченный заказ на "${booking.activityTitle}" от ${booking.clientName} на ${booking.date}${booking.time ? ` в ${booking.time}` : " (весь день)"}.`,
          link: `/partner/orders`,
        }).catch((e) =>
          console.error("Ошибка создания уведомления партнёру:", e)
        );

        await sendEmail({
          to: partnerEmail,
          subject: `Оплаченный заказ: ${booking.activityTitle}`,
          html: `
            <h1>Оплаченный заказ</h1>
            <p><strong>Активность:</strong> ${booking.activityTitle}</p>
            <p><strong>Дата:</strong> ${booking.date}</p>
            <p><strong>Время:</strong> ${booking.time || "Весь день"}</p>
            <p><strong>Клиент:</strong> ${booking.clientName}</p>
            <p><strong>Телефон:</strong> ${booking.clientPhone}</p>
            <p><strong>Email:</strong> ${booking.clientEmail}</p>
            <p><strong>Статус оплаты:</strong> ${Status}</p>
            <hr />
            <p>ID бронирования: ${booking.id}</p>
            <p>С уважением, ${appName}.</p>
          `,
        });
      }

      await sendEmail({
        to: booking.clientEmail,
        subject: `Оплата подтверждена: ${booking.activityTitle}`,
        html: `
          <h1>Оплата подтверждена</h1>
          <p><strong>Активность:</strong> ${booking.activityTitle}</p>
          <p><strong>Дата:</strong> ${booking.date}</p>
          <p><strong>Время:</strong> ${booking.time || "Весь день"}</p>
          <p><strong>Сумма:</strong> ${booking.price} ₽</p>
          <p><strong>Статус оплаты:</strong> ${Status}</p>
          <hr />
          <p>ID бронирования: ${booking.id}</p>
          <p>С уважением, ${appName}.</p>
        `,
      });

      const adminEmail = getMainAdminEmail();
      await sendEmail({
        to: adminEmail,
        subject: `Оплачено: ${booking.activityTitle}`,
        html: `
          <h1>Бронирование оплачено</h1>
          <p><strong>Активность:</strong> ${booking.activityTitle}</p>
          <p><strong>Дата:</strong> ${booking.date}</p>
          <p><strong>Время:</strong> ${booking.time || "Весь день"}</p>
          <p><strong>Клиент:</strong> ${booking.clientName}</p>
          <p><strong>Телефон:</strong> ${booking.clientPhone}</p>
          <p><strong>Email:</strong> ${booking.clientEmail}</p>
          <p><strong>Статус оплаты:</strong> ${Status}</p>
          <hr />
          <p>ID бронирования: ${booking.id}</p>
          <p>С уважением, ${appName}.</p>
        `,
      });
    } else if (isPaymentFailed(Status)) {
      await failBookingPayment(booking.id, Status);

      const activity = await getActivityById(booking.activityId);

      createNotification({
        recipientEmail: booking.clientEmail,
        type: "booking_status",
        title: "Оплата не прошла",
        message: `Оплата бронирования на "${booking.activityTitle}" не прошла. Попробуйте снова или свяжитесь с поддержкой.`,
        link: `/client/bookings/${booking.id}`,
      }).catch((e) => console.error("Ошибка создания уведомления клиенту:", e));

      const partnerEmail = activity?.partnerEmail;
      if (partnerEmail) {
        createNotification({
          recipientEmail: partnerEmail,
          type: "new_order",
          title: "Заказ отменён",
          message: `Заказ на "${booking.activityTitle}" от ${booking.clientName} отменён — оплата не прошла.`,
          link: `/partner/orders`,
        }).catch((e) =>
          console.error("Ошибка создания уведомления партнёру:", e)
        );
      }
    }

    return NextResponse.json({ Success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
