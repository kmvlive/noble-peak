import { NextRequest, NextResponse } from "next/server";
import { getBookingById } from "@/lib/models";
import { getClientEmailFromRequest } from "@/lib/client-auth";

export async function GET(request: NextRequest) {
  try {
    const clientEmail = getClientEmailFromRequest(request);
    if (!clientEmail) {
      return NextResponse.json(
        { error: "Необходимо авторизоваться" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json(
        { error: "Не указан ID бронирования" },
        { status: 400 }
      );
    }

    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: "Бронирование не найдено" },
        { status: 404 }
      );
    }

    if (booking.clientEmail !== clientEmail) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    return NextResponse.json({
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentId: booking.paymentId,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
