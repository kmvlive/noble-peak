import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getListingsByStatus,
  getPartnerByEmail,
  getAgentCommissionRateForMonth,
} from "@/lib/models";
import { mockListings } from "@/lib/mock-data";

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const listings = await getListingsByStatus("pending");
      const enriched = await Promise.all(
        listings.map(async (listing) => {
          let agentCommissionPercent = 0;
          if (listing.partnerEmail) {
            const partner = await getPartnerByEmail(listing.partnerEmail);
            if (partner?.agentEmail) {
              const rate = await getAgentCommissionRateForMonth(
                partner.agentEmail
              );
              agentCommissionPercent = Math.round(rate * 100);
            }
          }
          return { ...listing, agentCommissionPercent };
        })
      );
      return NextResponse.json(enriched);
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
