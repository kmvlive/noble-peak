import { notFound } from "next/navigation";
import { ActivityPageContent } from "@/components/activity-page-content";
import type { Activity } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const baseUrl = process.env.BASE_URL || "http://localhost:8080";
  let activity: Activity | null = null;

  try {
    const res = await fetch(`${baseUrl}/api/activities/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      if (res.status === 404) notFound();
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    activity = {
      id: data.id,
      title: data.title,
      shortDescription: data.shortDescription,
      description: data.description,
      images: data.images,
      category: data.section,
      price: data.price,
      partnerPrice: data.partnerPrice,
      imageGradient: data.imageGradient,
      likes: data.likes,
      isPopular: data.isPopular,
      over18: data.over18,
      orderType: data.orderType,
      location: data.location,
    };
  } catch (error) {
    console.error("Ошибка при загрузке активности:", error);
    notFound();
  }

  if (!activity) notFound();

  return <ActivityPageContent activity={activity} />;
}
