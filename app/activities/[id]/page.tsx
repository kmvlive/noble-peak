import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ActivityPageContent } from "@/components/activity-page-content";
import type { Activity } from "@/lib/data";
import { appName } from "@/lib/app-name";
import { isDatabaseAvailable } from "@/lib/db";
import { getPartnerByEmail } from "@/lib/models";
import { mockPartners } from "@/lib/mock-data";

export const revalidate = 60;

async function fetchActivity(id: string): Promise<Activity | null> {
  const baseUrl = process.env.BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${baseUrl}/api/activities/${id}`, {
      next: { revalidate: 60, tags: [`activity-${id}`, "activities"] },
    });
    if (!res.ok) return null;
    const data = await res.json();

    let partnerSlug: string | undefined;
    if (data.partnerEmail) {
      const dbAvailable = await isDatabaseAvailable();
      if (dbAvailable) {
        const partner = await getPartnerByEmail(data.partnerEmail);
        if (partner?.slug) partnerSlug = partner.slug;
      } else {
        const mock = mockPartners.find((p) => p.email === data.partnerEmail);
        if (mock?.slug) partnerSlug = mock.slug;
      }
    }

    return {
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
      isMultiDay: data.isMultiDay,
      partnerEmail: data.partnerEmail,
      partnerSlug,
    };
  } catch {
    return null;
  }
}

function firstRealImage(images: string[]): string | undefined {
  return images.find(
    (src) => src.startsWith("http") || src.startsWith("/uploads/")
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const activity = await fetchActivity(id);

  if (!activity) {
    return {
      title: appName,
    };
  }

  const title = `${activity.title} | ${appName}`;
  const description =
    activity.shortDescription ||
    activity.description.replace(/<[^>]*>/g, "").slice(0, 160);
  const image = firstRealImage(activity.images);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activity = await fetchActivity(id);

  if (!activity) notFound();

  return <ActivityPageContent activity={activity} />;
}
