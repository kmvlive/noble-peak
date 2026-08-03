import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { isDatabaseAvailable } from "@/lib/db";
import { getPartnerBySlug, getActivitiesByPartnerEmail } from "@/lib/models";
import { mockPartners, mockPartnerActivities } from "@/lib/mock-data";
import type { ActivityRecord, PartnerRecord } from "@/lib/models";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildRssXml(
  activities: ActivityRecord[],
  partner: PartnerRecord,
  baseUrl: string
): string {
  const partnerLink = `${baseUrl}/partners/${escapeXml(partner.slug ?? "")}`;

  const items = activities
    .map(
      (a) => `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(baseUrl)}/activities/${escapeXml(a.id)}</link>
      <guid>${escapeXml(baseUrl)}/activities/${escapeXml(a.id)}</guid>
      <description>${escapeXml(
        [
          a.shortDescription,
          a.location ? `Город: ${a.location}` : "",
          `Цена: ${a.price.toLocaleString("ru-RU")} ₽`,
        ]
          .filter(Boolean)
          .join(", ")
      )}</description>
      <price>${a.price}</price>
      <category>${escapeXml(a.section)}</category>
    </item>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(partner.name)} — активности партнёра</title>
    <link>${escapeXml(partnerLink)}</link>
    <description>${escapeXml(
      partner.description ?? `Активности партнёра ${partner.name}`
    )}</description>
    <language>ru</language>
    <atom:link href="${escapeXml(partnerLink + "/rss.xml")}" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const baseUrl = process.env.BASE_URL ?? "https://magazin-tour.ru";
  const dbAvailable = await isDatabaseAvailable();

  let partner: PartnerRecord | null = null;
  let activities: ActivityRecord[] = [];

  if (dbAvailable) {
    try {
      partner = await getPartnerBySlug(slug);
      if (!partner) notFound();

      activities = await getActivitiesByPartnerEmail(partner.email);
    } catch (error) {
      console.error("Ошибка получения данных партнёра для RSS:", error);
      partner = null;
    }
  }

  if (!partner) {
    const mock = mockPartners.find((p) => p.slug === slug);
    if (!mock) notFound();
    const mockActivities = mockPartnerActivities.filter(
      (a) => a.partnerEmail === mock.email && a.status === "active"
    );
    partner = mock;
    activities = mockActivities;
  }

  const activeActivities = activities
    .filter((a) => a.status === "active")
    .slice(0, 25);
  const xml = buildRssXml(activeActivities, partner, baseUrl);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
    },
  });
}
