import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getClientBookings, getOrdersByBookingIds } from "@/lib/models";
import { getClientEmailFromRequest } from "@/lib/client-auth";
import { mockBookings, mockOrders } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    const clientEmail = getClientEmailFromRequest(request);
    if (!clientEmail) {
      return NextResponse.json(
        { error: "Необходимо авторизоваться" },
        { status: 401 }
      );
    }

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json({
        bookings: enrich(mockBookings, mockOrders),
      });
    }

    const bookings = await getClientBookings(clientEmail);
    const orders = await getOrdersByBookingIds(bookings.map((b) => b.id));
    return NextResponse.json({ bookings: enrich(bookings, orders) });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

function enrich(
  bookings: { id: string; status: string }[],
  orders: { bookingId: string; orderNumber: string; status: string }[]
): Array<Record<string, unknown>> {
  const map = new Map<string, { orderNumber: string; status: string }>();
  for (const o of orders) {
    const prev = map.get(o.bookingId);
    if (!prev) map.set(o.bookingId, o);
  }
  return bookings.map((b) => ({
    ...b,
    orderNumber: map.get(b.id)?.orderNumber ?? "-",
    orderStatus: map.get(b.id)?.status ?? b.status,
  }));
}
