import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";
import { getAllListings, getListingById } from "@/lib/models";
import {
  syncListingBnovo,
  getBnovoConnection,
  getBnovoCredentials,
} from "@/lib/channels/bnovo";

function isAuthorized(request: NextRequest, listingId?: string): boolean {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (partnerEmail) return true;
  const token = request.headers.get("x-sync-token");
  const expected = process.env.CHANNEL_SYNC_TOKEN;
  if (expected && token === expected) return true;
  return Boolean(listingId === undefined && !expected && token);
}

export async function POST(request: NextRequest) {
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 }
    );
  }

  let body: { listingId?: string } = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    body = {};
  }

  if (!isAuthorized(request, body.listingId)) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  try {
    const results: Record<string, { ok: boolean; error?: string }> = {};

    if (body.listingId) {
      const listing = await getListingById(body.listingId);
      if (!listing) {
        return NextResponse.json(
          { error: "Объявление не найдено" },
          { status: 404 }
        );
      }
      results[body.listingId] = await syncListingBnovo(body.listingId);
    } else {
      const listings = await getAllListings();
      for (const listing of listings) {
        const conn = getBnovoConnection(listing);
        if (!conn) continue;
        if (!getBnovoCredentials(conn)) continue;
        results[listing.id] = await syncListingBnovo(listing.id);
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    console.error("Ошибка запуска синхронизации Bnovo:", error);
    return NextResponse.json(
      { error: "Ошибка синхронизации" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
