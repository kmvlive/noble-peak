import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getInfoPagesByTarget } from "@/lib/models";
import { mockInfoPages } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.max(
    1,
    Math.min(100, parseInt(searchParams.get("limit") ?? "10", 10))
  );

  const dbAvailable = await isDatabaseAvailable();

  let allItems = mockInfoPages.filter((p) => p.target === "tourist");

  if (dbAvailable) {
    try {
      const dbItems = await getInfoPagesByTarget("tourist");
      if (dbItems.length > 0) {
        allItems = dbItems;
      }
    } catch {
      // fallback to mock data
    }
  }

  allItems.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const total = allItems.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * limit;
  const items = allItems.slice(start, start + limit);

  return NextResponse.json({
    items,
    total,
    page: currentPage,
    totalPages,
    limit,
  });
}
