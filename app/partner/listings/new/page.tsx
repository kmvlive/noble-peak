import type { Metadata } from "next";
import { PartnerListingForm } from "@/components/partner-listing-form";

export const metadata: Metadata = {
  title: "Добавить объявление",
};

export default function PartnerListingNewPage() {
  return <PartnerListingForm />;
}
