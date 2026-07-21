import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getActivitiesByPartnerEmail,
  getBookingsByActivityIds,
} from "@/lib/models";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";
import { mockPartnerActivities, mockPartnerBookings } from "@/lib/mock-data";
import type { BookingRecord } from "@/lib/models";

function escapeCSV(value: string | number | null | undefined): string {
  if (value == null) return '""';
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

function bookingsToCSV(bookings: BookingRecord[]): string {
  const headers = [
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
      escapeCSV(b.status),
      escapeCSV(b.createdAt),
    ].join(",")
  );
  return "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
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
      if (isExport) {
        const csv = bookingsToCSV(bookings);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="partner-orders-${new Date().toISOString().split("T")[0]}.csv"`,
          },
        });
      }
      return NextResponse.json(bookings);
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

  if (isExport) {
    const csv = bookingsToCSV(filtered);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="partner-orders-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return NextResponse.json(filtered);
}
