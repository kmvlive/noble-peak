import type { Metadata } from "next";
import { RentCatalog } from "@/components/rent-catalog";
import { getListingsByStatus } from "@/lib/models";
import { isDatabaseAvailable } from "@/lib/db";
import { mockListings } from "@/lib/mock-data";
import type { ListingRecord } from "@noble-peak/shared";

export const metadata: Metadata = {
  title: "Снять что угодно",
};

export default async function RentPage() {
  let listings: ListingRecord[];

  try {
    if (await isDatabaseAvailable()) {
      listings = await getListingsByStatus("active");
    } else {
      listings = mockListings.filter((l) => l.status === "active");
    }
  } catch {
    listings = mockListings.filter((l) => l.status === "active");
  }

  return <RentCatalog initialListings={listings} />;
}
