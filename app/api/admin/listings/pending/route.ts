import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getListingsByStatus } from "@/lib/models";
import { mockListings } from "@/lib/mock-data";

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const listings = await getListingsByStatus("pending");
      return NextResponse.json(listings);
    } catch (error) {
      console.error("Ошибка получения pending объявлений:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockListings.filter((l) => l.status === "pending"));
}
