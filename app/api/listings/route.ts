import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { mockListings } from "@/lib/mock-data";
import { getAllListings, createListing, deleteListing } from "@/lib/models";
import { createListingSchema } from "@/lib/validation/listing";
import type { ListingRecord } from "@noble-peak/shared";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const city = searchParams.get("city");

  let listings: ListingRecord[];

  if (!(await isDatabaseAvailable())) {
    listings = mockListings;
  } else {
    try {
      listings = await getAllListings();
    } catch (error) {
      console.error("Ошибка получения объявлений:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  if (status) {
    listings = listings.filter((l) => l.status === status);
  }
  if (city) {
    listings = listings.filter((l) => l.city === city);
  }

  return NextResponse.json(listings);
}

export async function POST(request: NextRequest) {
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Некорректные данные",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const listing = await createListing({
      id: crypto.randomUUID(),
      ...parsed.data,
      status: "pending",
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания объявления:", error);
    return NextResponse.json(
      { error: "Ошибка создания объявления" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  const id = new URL(request.url).searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id обязателен" }, { status: 400 });
  }

  try {
    await deleteListing(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления объявления:", error);
    return NextResponse.json(
      { error: "Ошибка удаления объявления" },
      { status: 500 }
    );
  }
}
