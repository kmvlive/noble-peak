import { NextRequest, NextResponse } from "next/server";
import {
  verifyNotificationToken,
  isPaymentSuccessful,
  isPaymentFailed,
} from "@/lib/payment";
import {
  getBookingById,
  confirmBookingPayment,
  failBookingPayment,
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

    if (!verifyNotificationToken(params, Token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    const booking = await getBookingById(OrderId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (isPaymentSuccessful(Status)) {
      await confirmBookingPayment(booking.id, Status);

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
    }

    return NextResponse.json({ Success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
