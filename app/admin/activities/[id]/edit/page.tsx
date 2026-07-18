import { isDatabaseAvailable } from "@/lib/db";
import { getActivityById } from "@/lib/models";
import { AdminActivityForm } from "@/components/admin-activity-form";
import { notFound } from "next/navigation";
import { mockActivities } from "@/lib/mock-data";

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let activity = null;

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      activity = await getActivityById(id);
    } catch {
      console.error("Ошибка загрузки активности из БД");
    }
  }

  if (!activity) {
    const mock = mockActivities.find((a) => a.id === id);
    if (mock) {
      activity = mock;
    }
  }

  if (!activity) {
    notFound();
  }

  return <AdminActivityForm activity={activity} />;
}
