import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { getOrderById, getPartnerByEmail } from "@/lib/models";
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
