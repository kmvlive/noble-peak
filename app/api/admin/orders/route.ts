import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { getAllOrders } from "@/lib/models";
import { mockOrders } from "@/lib/mock-data";
import type { OrderRecord } from "@/lib/models";

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.cookies.get("admin_token");
  return cookie?.value ?? null;
}

function escapeCSV(value: string | number | null | undefined): string {
  if (value == null) return '""';
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

function ordersToCSV(orders: OrderRecord[]): string {
  const headers = [
    "ID заказа",
    "Номер заказа",
    "ID бронирования",
    "Email клиента",
    "Имя клиента",
    "Телефон клиента",
    "ID активности",
    "Название активности",
    "Email партнёра",
    "Дата",
    "Время",
    "Цена",
    "Статус",
    "Дата создания",
  ];
  const rows = orders.map((o) =>
    [
      escapeCSV(o.id),
      escapeCSV(o.orderNumber),
      escapeCSV(o.bookingId),
      escapeCSV(o.clientEmail),
      escapeCSV(o.clientName),
      escapeCSV(o.clientPhone),
      escapeCSV(o.activityId),
      escapeCSV(o.activityTitle),
      escapeCSV(o.partnerEmail),
      escapeCSV(o.date),
      escapeCSV(o.time),
      escapeCSV(o.price),
      escapeCSV(o.status),
      escapeCSV(o.createdAt),
    ].join(",")
  );
  return "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
}

export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isExport = searchParams.get("export") === "csv";

  if (isExport) {
    const dbAvailable = await isDatabaseAvailable();
    let allOrders: OrderRecord[];
    if (dbAvailable) {
      const result = await getAllOrders({});
      allOrders = result.orders;
    } else {
      allOrders = [...mockOrders].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      );
    }
    const csv = ordersToCSV(allOrders);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "100", 10) || 100)
  );
  const search = searchParams.get("search") ?? "";
  const scope = searchParams.get("scope");
  const filter =
    scope === "cancelled_paid" || scope === "deleted"
      ? (scope as "cancelled_paid" | "deleted")
      : undefined;

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const offset = (page - 1) * limit;
    const result = await getAllOrders({
      limit,
      offset,
      search: search || undefined,
      filter,
    });
    return NextResponse.json({
      orders: result.orders,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  }

  let items = [...mockOrders];
  if (search) {
    const q = search.trim().toLowerCase();
    items = items.filter((o) => o.orderNumber.toLowerCase().includes(q));
  }
  if (filter === "deleted") {
    // В mock-данных удалённых (архивных) заказов нет.
    items = [];
  } else if (filter === "cancelled_paid") {
    items = items.filter((o) => o.status === "cancelled" && o.wasPaid === true);
  }
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const total = items.length;
  const offset = (page - 1) * limit;
  const orders = items.slice(offset, offset + limit);

  return NextResponse.json({
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
