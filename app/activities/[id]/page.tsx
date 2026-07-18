import { notFound } from "next/navigation";
import { activities } from "@/lib/data";
import { ActivityPageContent } from "@/components/activity-page-content";

export function generateStaticParams() {
  return activities.map((a) => ({ id: a.id }));
}

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activity = activities.find((a) => a.id === id);
  if (!activity) notFound();

  return <ActivityPageContent activity={activity} />;
}
