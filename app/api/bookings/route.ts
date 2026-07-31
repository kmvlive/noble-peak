import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import {
  createBooking,
  createNotification,
  removeBookedSlotFromCalendar,
  createOrder,
  getActivityById,
  getClientByPhone,
  createClient,
  getClientByEmail,
} from "@/lib/models";
import {
  getClientEmailFromRequest,
  createClientToken,
} from "@/lib/client-auth";
import { sendEmail } from "@/lib/email";
import { appName } from "@/lib/app-name";
import { getMainAdminEmail } from "@/lib/auth";

const createBookingSchema = z.object({
  activityId: z.string().min(1),
  activityTitle: z.string().min(1),
  date: z.string().min(1),
  time: z.string().nullable(),
  clientName: z.string().min(1),
  clientPhone: z.string().min(1),
  details: z.string().max(5000).default(""),
  price: z.number().min(0),
  isGuest: z.boolean().optional().default(false),
});

function generateGuestEmail(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  return `guest_${cleanPhone}@magazin-tour.ru`;
}

export async function POST(request: NextRequest) {
  try {
    const clientEmail = getClientEmailFromRequest(request);
    const parsed = createBookingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
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
      isGuest,
    } = parsed.data;

    let effectiveEmail = clientEmail;

    if (!effectiveEmail) {
      if (!isGuest) {
        return NextResponse.json(
          { error: "Необходимо авторизоваться" },
          { status: 401 }
        );
      }

      const dbAvailable = await isDatabaseAvailable();

      const existingClient = dbAvailable
        ? await getClientByPhone(clientPhone)
        : null;
      if (existingClient) {
        return NextResponse.json(
          {
            error:
              "Этот номер уже используется. Пожалуйста, авторизуйтесь для оплаты",
          },
          { status: 409 }
        );
      }

      const guestEmail = generateGuestEmail(clientPhone);

      if (dbAvailable) {
        const existingGuest = await getClientByEmail(guestEmail);
        if (!existingGuest) {
          await createClient({
            email: guestEmail,
            name: clientName,
            phone: clientPhone,
            passwordHash: "",
          });
        }
      }

      effectiveEmail = guestEmail;
    }

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "База данных недоступна. Попробуйте позже." },
        { status: 503 }
      );
    }

    const booking = await createBooking(
      {
        clientEmail: effectiveEmail,
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

    const activity = await getActivityById(activityId);
    createOrder({
      bookingId: booking.id,
      clientEmail: effectiveEmail,
      clientName,
      clientPhone,
      activityId,
      activityTitle,
      partnerEmail: activity?.partnerEmail ?? null,
      date,
      time,
      price,
      status: booking.status,
    }).catch((e) => console.error("Ошибка создания заказа:", e));

    removeBookedSlotFromCalendar(activityId, date, time).catch((e) =>
      console.error("Ошибка обновления календаря после бронирования:", e)
    );

    const adminEmail = getMainAdminEmail();
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
        <p><strong>Email:</strong> ${effectiveEmail}</p>
        <p><strong>Подробности:</strong> ${details || "—"}</p>
        <hr />
        <p>ID бронирования: ${booking.id}</p>
        <p>С уважением, ${appName}.</p>
      `,
    });

    createNotification({
      recipientEmail: effectiveEmail,
      type: "booking_status",
      title: "Бронирование создано",
      message: `Ваше бронирование на "${activityTitle}" на ${date}${time ? ` в ${time}` : " (весь день)"} создано.`,
      link: `/client/bookings/${booking.id}`,
    }).catch((e) => console.error("Ошибка создания уведомления клиенту:", e));

    const partnerEmail = activity?.partnerEmail;
    if (partnerEmail) {
      createNotification({
        recipientEmail: partnerEmail,
        type: "new_order",
        title: "Новый заказ",
        message: `Новый заказ на "${activityTitle}" от ${clientName} на ${date}${time ? ` в ${time}` : " (весь день)"}.`,
        link: `/partner/orders`,
      }).catch((e) =>
        console.error("Ошибка создания уведомления партнёру:", e)
      );

      await sendEmail({
        to: partnerEmail,
        subject: `Новый заказ: ${activityTitle}`,
        html: `
          <h1>Новый заказ</h1>
          <p><strong>Активность:</strong> ${activityTitle}</p>
          <p><strong>Дата:</strong> ${date}</p>
          <p><strong>Время:</strong> ${time || "Весь день"}</p>
          <p><strong>Клиент:</strong> ${clientName}</p>
          <p><strong>Телефон:</strong> ${clientPhone}</p>
          <p><strong>Email:</strong> ${effectiveEmail}</p>
          <p><strong>Подробности:</strong> ${details || "—"}</p>
          <hr />
          <p>ID бронирования: ${booking.id}</p>
          <p>С уважением, ${appName}.</p>
        `,
      });
    }

    await sendEmail({
      to: effectiveEmail,
      subject: `Бронирование подтверждено: ${activityTitle}`,
      html: `
        <h1>Бронирование подтверждено</h1>
        <p><strong>Активность:</strong> ${activityTitle}</p>
        <p><strong>Дата:</strong> ${date}</p>
        <p><strong>Время:</strong> ${time || "Весь день"}</p>
        <p><strong>Имя:</strong> ${clientName}</p>
        <p><strong>Телефон:</strong> ${clientPhone}</p>
        <p><strong>Подробности:</strong> ${details || "—"}</p>
        <hr />
        <p>ID бронирования: ${booking.id}</p>
        <p>С уважением, ${appName}.</p>
      `,
    });

    const setPasswordToken = !clientEmail
      ? createClientToken(effectiveEmail)
      : null;

    return NextResponse.json({
      success: true,
      booking,
      setPasswordToken,
      isGuest: !clientEmail,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
