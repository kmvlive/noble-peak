import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getClientBookings,
  getOrdersByBookingIds,
  getAllActivities,
} from "@/lib/models";
import { getClientEmailFromRequest } from "@/lib/client-auth";
import { mockBookings, mockOrders, mockActivities } from "@/lib/mock-data";
import { computePartnerToPay } from "@/lib/utils";

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
      const activitiesMap = new Map(mockActivities.map((a) => [a.id, a]));
      const all = enrich(mockBookings, mockOrders, activitiesMap);
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
    const activities = await getAllActivities();
    const activitiesMap = new Map(activities.map((a) => [a.id, a]));
    const enriched = enrich(bookings, orders, activitiesMap);
    const result = isArchive
      ? enriched.filter((b) => Boolean(b.deletedAt))
      : enriched.filter((b) => !b.deletedAt);
    return NextResponse.json({ bookings: result });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

function enrich(
  bookings: {
    id: string;
    status: string;
    activityId?: string;
    price?: number;
  }[],
  orders: { bookingId: string; orderNumber: string; status: string }[],
  activitiesMap: Map<
    string,
    { orderType?: string; partnerPrice?: number; partnerPricePercent?: number }
  >
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
    partnerToPay: computePartnerToPay(
      b.activityId ? (activitiesMap.get(b.activityId) ?? null) : null,
      typeof b.price === "number" ? b.price : 0
    ),
  }));
}
