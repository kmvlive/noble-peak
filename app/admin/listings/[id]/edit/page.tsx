import { AdminListingEditForm } from "@/components/admin-listing-edit-form";

export default async function AdminListingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminListingEditForm listingId={id} />;
}
