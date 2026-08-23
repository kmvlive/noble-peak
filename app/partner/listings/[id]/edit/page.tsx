import { PartnerListingEditForm } from "@/components/partner-listing-edit-form";

export default async function PartnerListingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PartnerListingEditForm listingId={id} />;
}
