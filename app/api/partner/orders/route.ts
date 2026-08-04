import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getActivitiesByPartnerEmail,
  getBookingsByActivityIds,
  getOrdersByBookingIds,
} from "@/lib/models";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";
import {
  mockPartnerActivities,
  mockPartnerBookings,
  mockOrders,
} from "@/lib/mock-data";
import type { BookingRecord, OrderRecord } from "@/lib/models";

export interface PartnerOrderView extends BookingRecord {
  orderNumber: string;
  orderStatus: string;
  wasPaid?: boolean;
}

function escapeCSV(value: string | number | null | undefined): string {
  if (value == null) return '""';
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

function bookingsToCSV(bookings: PartnerOrderView[]): string {
  const headers = [
    "Номер заказа",
    "ID бронирования",
    "Email клиента",
    "Имя клиента",
    "Телефон клиента",
    "ID активности",
    "Название активности",
    "Дата",
    "Время",
    "Подробности",
    "Цена",
    "Статус",
    "Дата создания",
  ];
  const rows = bookings.map((b) =>
    [
      escapeCSV(b.orderNumber),
      escapeCSV(b.id),
      escapeCSV(b.clientEmail),
      escapeCSV(b.clientName),
      escapeCSV(b.clientPhone),
      escapeCSV(b.activityId),
      escapeCSV(b.activityTitle),
      escapeCSV(b.date),
      escapeCSV(b.time),
      escapeCSV(b.details),
      escapeCSV(b.price),
      escapeCSV(b.orderStatus),
      escapeCSV(b.createdAt),
    ].join(",")
  );
  return "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
}

function mergeOrders(
  bookings: BookingRecord[],
  orders: OrderRecord[]
): PartnerOrderView[] {
  const map = new Map<string, OrderRecord>();
  for (const o of orders) map.set(o.bookingId, o);
  return bookings.map((b) => {
    const o = map.get(b.id);
    return {
      ...b,
      orderNumber: o?.orderNumber ?? "-",
      orderStatus: o?.status ?? b.status,
      wasPaid: o?.wasPaid,
    };
  });
}

export async function GET(request: NextRequest) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isExport = searchParams.get("export") === "csv";

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const activities = await getActivitiesByPartnerEmail(partnerEmail);
      const activityIds = activities.map((a) => a.id);
      const bookings = await getBookingsByActivityIds(activityIds);
      const orders = await getOrdersByBookingIds(bookings.map((b) => b.id));
      const view = mergeOrders(bookings, orders);
      if (isExport) {
        const csv = bookingsToCSV(view);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="partner-orders-${new Date().toISOString().split("T")[0]}.csv"`,
          },
        });
      }
      return NextResponse.json(view);
    } catch (error) {
      console.error("Ошибка получения заказов партнёра:", error);
      return NextResponse.json(
        { error: "Ошибка загрузки заказов" },
        { status: 500 }
      );
    }
  }

  const partnerActivityIds = mockPartnerActivities
    .filter((a) => a.partnerEmail === partnerEmail)
    .map((a) => a.id);
  const filtered = mockPartnerBookings.filter((b) =>
    partnerActivityIds.includes(b.activityId)
  );
  const view = mergeOrders(filtered, mockOrders);

  if (isExport) {
    const csv = bookingsToCSV(view);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="partner-orders-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return NextResponse.json(view);
}
