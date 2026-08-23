import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getListingById } from "@/lib/models";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const headers = {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
  };

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const listing = await getListingById(id);
      if (!listing || listing.status !== "active") {
        return NextResponse.json(
          { error: "Объявление не найдено" },
          { status: 404 }
        );
      }
      return NextResponse.json(listing, { headers });
    } catch (error) {
      console.error("Ошибка получения объявления:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  const { mockListings } = await import("@/lib/mock-data");
  const mock = mockListings.find((l) => l.id === id && l.status === "active");
  if (!mock) {
    return NextResponse.json(
      { error: "Объявление не найдено" },
      { status: 404 }
    );
  }
  return NextResponse.json(mock, { headers });
}
