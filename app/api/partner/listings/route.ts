import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getListingsByPartnerEmail, createListing } from "@/lib/models";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";
import { mockListings } from "@/lib/mock-data";
import { createPartnerListingSchema } from "@/lib/validation/listing";

export async function GET(request: NextRequest) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const listings = await getListingsByPartnerEmail(partnerEmail);
      return NextResponse.json(listings);
    } catch (error) {
      console.error("Ошибка получения объявлений партнёра:", error);
      return NextResponse.json(
        { error: "Ошибка загрузки объявлений" },
        { status: 500 }
      );
    }
  }

  const filtered = mockListings.filter((l) => l.partnerEmail === partnerEmail);
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createPartnerListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const totalPrice =
      data.rooms && data.rooms.length > 0
        ? data.rooms.reduce((sum, r) => sum + r.price, 0)
        : 0;
    const totalGuests =
      data.rooms && data.rooms.length > 0
        ? data.rooms.reduce((sum, r) => sum + r.capacity, 0)
        : 1;

    const listing = await createListing({
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      images: data.images,
      housingType: data.housingType,
      subtype: data.subtype,
      city: data.city,
      address: data.address || undefined,
      price: totalPrice,
      guests: totalGuests,
      rooms: data.rooms,
      meals: data.meals,
      partnerEmail,
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
