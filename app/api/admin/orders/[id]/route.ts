import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import {
  getOrderById,
  getPartnerByEmail,
  updateOrderStatusById,
  updateBookingStatus,
  createNotification,
} from "@/lib/models";
import { mockOrders, mockPartners } from "@/lib/mock-data";

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.cookies.get("admin_token");
  return cookie?.value ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getTokenFromRequest(_request);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const { id } = await params;
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    let partnerName: string | null = null;
    if (order.partnerEmail) {
      const partner = await getPartnerByEmail(order.partnerEmail);
      partnerName = partner?.name ?? null;
    }

    return NextResponse.json({ order, partnerName });
  }

  const mockOrder = mockOrders.find((o) => o.id === id);
  if (!mockOrder) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  let partnerName: string | null = null;
  if (mockOrder.partnerEmail) {
    const partner = mockPartners.find(
      (p) => p.email === mockOrder.partnerEmail
    );
    partnerName = partner?.name ?? null;
  }

  return NextResponse.json({ order: mockOrder, partnerName });
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getTokenFromRequest(_request);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна. Попробуйте позже." },
      { status: 503 }
    );
  }

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  // Оплаченная активность отменяется только администратором с подтверждением.
  await updateOrderStatusById(order.id, "cancelled");
  await updateBookingStatus(order.bookingId, "cancelled");

  createNotification({
    recipientEmail: order.clientEmail,
    type: "booking_status",
    title: "Заказ отменён",
    message: `Администратор отменил ваш оплаченный заказ на "${order.activityTitle}" на ${order.date}.`,
    link: `/client/bookings`,
  }).catch((e) =>
    console.error("Ошибка создания уведомления клиенту об отмене:", e)
  );

  if (order.partnerEmail) {
    createNotification({
      recipientEmail: order.partnerEmail,
      type: "booking_status",
      title: "Заказ отменён",
      message: `Администратор отменил оплаченный заказ на "${order.activityTitle}" от ${order.clientName} на ${order.date}.`,
      link: `/partner/orders`,
    }).catch((e) =>
      console.error("Ошибка создания уведомления партнёру об отмене:", e)
    );
  }

  return NextResponse.json({ success: true, orderId: order.id });
}
