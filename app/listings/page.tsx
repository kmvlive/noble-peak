import type { Metadata } from "next";
import { ListingsManager } from "@/components/listings-manager";
import { getAllListings } from "@/lib/models";
import { isDatabaseAvailable } from "@/lib/db";
import { mockListings } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Объявления жилья",
};

export default async function ListingsPage() {
  let listings: typeof mockListings;

  try {
    if (await isDatabaseAvailable()) {
      listings = await getAllListings();
    } else {
      listings = mockListings;
    }
  } catch {
    listings = mockListings;
  }

  return <ListingsManager initialListings={listings} />;
}
