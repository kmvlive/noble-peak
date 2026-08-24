import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getListingById, updateListing } from "@/lib/models";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";
import { mockListings } from "@/lib/mock-data";
import { createPartnerListingSchema } from "@/lib/validation/listing";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const { id } = await params;

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const listing = await getListingById(id);
      if (!listing || listing.partnerEmail !== partnerEmail) {
        return NextResponse.json(
          { error: "Объявление не найдено" },
          { status: 404 }
        );
      }
      return NextResponse.json(listing);
    } catch (error) {
      console.error("Ошибка получения объявления:", error);
      return NextResponse.json(
        { error: "Ошибка загрузки объявления" },
        { status: 500 }
      );
    }
  }

  const mock = mockListings.find(
    (l) => l.id === id && l.partnerEmail === partnerEmail
  );
  if (!mock) {
    return NextResponse.json(
      { error: "Объявление не найдено" },
      { status: 404 }
    );
  }
  return NextResponse.json(mock);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;
    const listing = await getListingById(id);
    if (!listing || listing.partnerEmail !== partnerEmail) {
      return NextResponse.json(
        { error: "Объявление не найдено" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = createPartnerListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const isRooms = data.housingType === "rooms";
    const totalPrice =
      isRooms && data.rooms && data.rooms.length > 0
        ? data.rooms.reduce((sum, r) => sum + r.price, 0)
        : (data.price ?? 0);
    const totalGuests =
      isRooms && data.rooms && data.rooms.length > 0
        ? data.rooms.reduce((sum, r) => sum + r.capacity, 0)
        : (data.guests ?? 1);

    const updated = await updateListing(id, {
      title: data.title,
      description: data.description,
      images: data.images,
      housingType: data.housingType,
      subtype: data.subtype,
      city: data.city,
      address: data.address || undefined,
      latitude: data.latitude,
      longitude: data.longitude,
      price: totalPrice,
      guests: totalGuests,
      rooms: data.rooms,
      meals: data.meals,
      channelConnections: data.channelConnections?.map((conn) => ({
        ...conn,
        connectedAt: new Date().toISOString(),
      })),
      status: listing.status,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Ошибка обновления объявления:", error);
    return NextResponse.json(
      { error: "Ошибка обновления объявления" },
      { status: 500 }
    );
  }
}
