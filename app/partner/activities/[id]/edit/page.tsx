import { PartnerActivityEditForm } from "@/components/partner-activity-edit-form";

export default async function PartnerActivityEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PartnerActivityEditForm activityId={id} />;
}
