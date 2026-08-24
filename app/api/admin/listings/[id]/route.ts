import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getListingById,
  updateListing,
  getPartnerByEmail,
  getAgentCommissionRateForMonth,
} from "@/lib/models";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";
import { housingTypeSchema, listingRoomSchema } from "@/lib/validation/listing";
import { listingChannelConnectionsSchema } from "@/lib/validation/listing-channel";
import type { ListingRecord } from "@noble-peak/shared";

const updateListingSchema = z.object({
  status: z.enum(["active", "pending", "rejected"]).optional(),
  partnerPrice: z.number().min(0).optional(),
  partnerPricePercent: z.number().min(0).max(100).optional(),
  housingType: housingTypeSchema.optional(),
  subtype: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10_000).optional(),
  city: z.string().min(1).max(100).optional(),
  address: z.string().max(300).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  images: z.array(z.string()).max(30).optional(),
  price: z.number().nonnegative().optional(),
  guests: z.number().int().nonnegative().optional(),
  rooms: z.array(listingRoomSchema).min(1).max(100).optional(),
  meals: z.array(z.string().min(1).max(200)).max(50).optional(),
  channelConnections: listingChannelConnectionsSchema.optional(),
});

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
  const { id } = await params;

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const listing = await getListingById(id);
      if (!listing) {
        return NextResponse.json(
          { error: "Объявление не найдено" },
          { status: 404 }
        );
      }
      return NextResponse.json(listing);
    } catch (error) {
      console.error("Ошибка получения объявления:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  const { mockListings } = await import("@/lib/mock-data");
  const mock = mockListings.find((l) => l.id === id);
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
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
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
    const body = await request.json();
    const parsed = updateListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await getListingById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Объявление не найдено" },
        { status: 404 }
      );
    }

    const { channelConnections, ...restData } = parsed.data;
    const updateData: Partial<
      Omit<ListingRecord, "id" | "createdAt" | "updatedAt">
    > = { ...restData };

    if (channelConnections !== undefined) {
      updateData.channelConnections = channelConnections.map((conn) => ({
        ...conn,
        connectedAt: new Date().toISOString(),
      }));
    }

    if (
      updateData.status === "active" &&
      updateData.partnerPricePercent !== undefined
    ) {
      let effectivePercent = updateData.partnerPricePercent;

      if (existing.partnerEmail) {
        const partner = await getPartnerByEmail(existing.partnerEmail);
        if (partner?.agentEmail) {
          const rate = await getAgentCommissionRateForMonth(partner.agentEmail);
          effectivePercent = Math.max(
            0,
            effectivePercent - Math.round(rate * 100)
          );
          updateData.partnerPricePercent = effectivePercent;
        }
      }

      updateData.partnerPrice = Math.round(
        existing.price * (effectivePercent / 100)
      );
    }

    const updated = await updateListing(id, updateData);
    revalidateTag("listings", "max");
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Ошибка обновления объявления:", error);
    return NextResponse.json(
      { error: "Ошибка обновления объявления" },
      { status: 500 }
    );
  }
}
