import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { getAllOrders } from "@/lib/models";
import { mockOrders } from "@/lib/mock-data";

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.cookies.get("admin_token");
  return cookie?.value ?? null;
}

export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "100", 10) || 100)
  );
  const search = searchParams.get("search") ?? "";

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    const offset = (page - 1) * limit;
    const result = await getAllOrders({
      limit,
      offset,
      search: search || undefined,
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
