import type { Metadata } from "next";
import { RentCatalog } from "@/components/rent-catalog";

export const metadata: Metadata = {
  title: "Снять что угодно",
};

export default function RentPage() {
  return <RentCatalog />;
}
