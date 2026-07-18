import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { createBooking } from "@/lib/models";
import { getClientEmailFromRequest } from "@/lib/client-auth";
import { sendEmail } from "@/lib/email";
import { appName } from "@/lib/app-name";
import { getAdminEmail } from "@/lib/auth";

const createBookingSchema = z.object({
  activityId: z.string().min(1),
  activityTitle: z.string().min(1),
  date: z.string().min(1),
  time: z.string().nullable(),
  clientName: z.string().min(1),
  clientPhone: z.string().min(1),
  details: z.string().max(5000).default(""),
  price: z.number().min(0),
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

    const parsed = createBookingSchema.safeParse(await request.json());
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

    const {
      activityId,
      activityTitle,
      date,
      time,
      clientName,
      clientPhone,
      details,
      price,
    } = parsed.data;

    const booking = await createBooking(
      {
        clientEmail,
        clientName,
        clientPhone,
        activityId,
        activityTitle,
        date,
        time,
        details,
        price,
      },
      false
    );

    const adminEmail = getAdminEmail();
    await sendEmail({
      to: adminEmail,
      subject: `Новое бронирование: ${activityTitle}`,
      html: `
        <h1>Новое бронирование</h1>
        <p><strong>Активность:</strong> ${activityTitle}</p>
        <p><strong>Дата:</strong> ${date}</p>
        <p><strong>Время:</strong> ${time || "Весь день"}</p>
        <p><strong>Клиент:</strong> ${clientName}</p>
        <p><strong>Телефон:</strong> ${clientPhone}</p>
        <p><strong>Email:</strong> ${clientEmail}</p>
        <p><strong>Подробности:</strong> ${details || "—"}</p>
        <hr />
        <p>ID бронирования: ${booking.id}</p>
        <p>С уважением, ${appName}.</p>
      `,
    });

    return NextResponse.json({ success: true, booking });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
