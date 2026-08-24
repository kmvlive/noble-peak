import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllListings } from "@/lib/models";
import { mockListings } from "@/lib/mock-data";

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(mockListings);
  }

  try {
    const listings = await getAllListings();
    return NextResponse.json(listings);
  } catch (error) {
    console.error("Ошибка получения всех объявлений:", error);
    return NextResponse.json(
      { error: "Ошибка получения данных из DynamoDB" },
      { status: 500 }
    );
  }
}
