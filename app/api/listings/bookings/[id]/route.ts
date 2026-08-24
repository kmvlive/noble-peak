import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getListingBookingById,
  getListingById,
  updateListingBookingStatus,
  deleteListingBooking,
  createNotification,
} from "@/lib/models";
import { getClientEmailFromRequest } from "@/lib/client-auth";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";

const updateListingBookingStatusSchema = z.object({
  status: z.enum(["confirmed", "cancelled", "completed"]),
});

function formatRange(booking: {
  listingTitle: string;
  checkIn: string;
  checkOut: string;
}): string {
  return `"${booking.listingTitle}" с ${booking.checkIn} по ${booking.checkOut}`;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const clientEmail = getClientEmailFromRequest(request);
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!clientEmail && !partnerEmail) {
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

  const parsed = updateListingBookingStatusSchema.safeParse(
    await request.json()
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const booking = await getListingBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: "Бронь не найдена" }, { status: 404 });
    }

    const listing = await getListingById(booking.listingId);

    if (
      partnerEmail &&
      listing?.partnerEmail &&
      listing.partnerEmail !== partnerEmail
    ) {
      return NextResponse.json(
        { error: "Нет доступа к этой брони" },
        { status: 403 }
      );
    }

    if (clientEmail && booking.clientEmail !== clientEmail) {
      return NextResponse.json(
        { error: "Нет доступа к этой брони" },
        { status: 403 }
      );
    }

    const newStatus = parsed.data.status;
    if (newStatus === booking.status) {
      return NextResponse.json({ success: true, booking });
    }

    const updated = await updateListingBookingStatus(id, newStatus);

    const description = formatRange(booking);
    const statusLabel =
      newStatus === "cancelled"
        ? "отменена"
        : newStatus === "completed"
          ? "исполнена"
          : "подтверждена";

    createNotification({
      recipientEmail: booking.clientEmail,
      type: "booking_status",
      title: "Статус брони жилья изменён",
      message: `Бронь ${description} ${statusLabel}.`,
      link: `/listings/${booking.listingId}`,
    }).catch((e) =>
      console.error("Ошибка уведомления клиенту об изменении статуса:", e)
    );

    if (listing?.partnerEmail) {
      createNotification({
        recipientEmail: listing.partnerEmail,
        type: "booking_status",
        title: "Статус брони жилья изменён",
        message: `Бронь ${description} ${statusLabel}.`,
        link: `/partner/listings/${booking.listingId}/calendar`,
      }).catch((e) =>
        console.error("Ошибка уведомления партнёру об изменении статуса:", e)
      );
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Ошибка изменения статуса брони жилья:", error);
    return NextResponse.json(
      { error: "Ошибка изменения статуса брони" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const clientEmail = getClientEmailFromRequest(request);
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!clientEmail && !partnerEmail) {
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

  try {
    const booking = await getListingBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: "Бронь не найдена" }, { status: 404 });
    }

    const listing = await getListingById(booking.listingId);

    if (
      partnerEmail &&
      listing?.partnerEmail &&
      listing.partnerEmail !== partnerEmail
    ) {
      return NextResponse.json(
        { error: "Нет доступа к этой брони" },
        { status: 403 }
      );
    }

    if (clientEmail && booking.clientEmail !== clientEmail) {
      return NextResponse.json(
        { error: "Нет доступа к этой брони" },
        { status: 403 }
      );
    }

    const actorIsClient = Boolean(clientEmail);
    await deleteListingBooking(id);

    const description = formatRange(booking);

    // Противоположная сторона получает уведомление об удалении брони.
    if (actorIsClient) {
      if (listing?.partnerEmail) {
        createNotification({
          recipientEmail: listing.partnerEmail,
          type: "booking_status",
          title: "Бронь жилья удалена",
          message: `Клиент удалил бронь ${description}.`,
          link: `/partner/listings/${booking.listingId}/calendar`,
        }).catch((e) =>
          console.error("Ошибка уведомления партнёру об удалении брони:", e)
        );
      }
    } else {
      createNotification({
        recipientEmail: booking.clientEmail,
        type: "booking_status",
        title: "Бронь жилья удалена",
        message: `Партнёр удалил бронь ${description}.`,
        link: `/listings/${booking.listingId}`,
      }).catch((e) =>
        console.error("Ошибка уведомления клиенту об удалении брони:", e)
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления брони жилья:", error);
    return NextResponse.json(
      { error: "Ошибка удаления брони" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
