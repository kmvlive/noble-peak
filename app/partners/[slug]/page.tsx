import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PartnerPublicProfileContent } from "@/components/partner-public-profile-content";
import { appName } from "@/lib/app-name";

export const dynamic = "force-dynamic";

interface PartnerPublicData {
  email: string;
  name: string;
  photo: string;
  description: string;
  slug: string;
  activities: {
    id: string;
    title: string;
    shortDescription: string;
    price: number;
    location?: string;
    images: string[];
    imageGradient: string;
    section: string;
  }[];
}

async function fetchPartnerProfile(
  slug: string
): Promise<PartnerPublicData | null> {
  const baseUrl = process.env.BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(
      `${baseUrl}/api/partners/${encodeURIComponent(slug)}`,
      {
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchPartnerProfile(slug);

  if (!data) {
    return { title: appName };
  }

  return {
    title: `${data.name} | ${appName}`,
    description: data.description
      ? data.description.replace(/<[^>]*>/g, "").slice(0, 160)
      : `Профиль партнёра — ${data.name}`,
  };
}

export default async function PartnerPublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchPartnerProfile(slug);

  if (!data) notFound();

  return <PartnerPublicProfileContent partner={data} />;
}
