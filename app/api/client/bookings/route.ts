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

    const { searchParams } = new URL(request.url);
    const isArchive = searchParams.get("scope") === "archive";

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      const all = enrich(mockBookings, mockOrders);
      return NextResponse.json({
        bookings: isArchive
          ? all.filter((b) => Boolean(b.deletedAt))
          : all.filter((b) => !b.deletedAt),
      });
    }

    const bookings = await getClientBookings(clientEmail, {
      includeArchived: true,
    });
    const orders = await getOrdersByBookingIds(bookings.map((b) => b.id));
    const enriched = enrich(bookings, orders);
    const result = isArchive
      ? enriched.filter((b) => Boolean(b.deletedAt))
      : enriched.filter((b) => !b.deletedAt);
    return NextResponse.json({ bookings: result });
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
