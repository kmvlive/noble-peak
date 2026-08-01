import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllActivities } from "@/lib/models";
import { mockActivities } from "@/lib/mock-data";
import type { ActivityRecord } from "@/lib/models";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildRssXml(activities: ActivityRecord[], baseUrl: string): string {
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
      <category>${escapeXml(a.section)}</category>
    </item>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Магазин туров и активностей</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Актуальные активности, туры и развлечения</description>
    <language>ru</language>
    <atom:link href="${escapeXml(baseUrl)}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
}

export async function GET() {
  const baseUrl = process.env.BASE_URL ?? "https://magazin-tour.ru";
  const dbAvailable = await isDatabaseAvailable();

  let activities: ActivityRecord[];

  if (dbAvailable) {
    try {
      activities = await getAllActivities();
    } catch (error) {
      console.error("Ошибка получения активностей для RSS:", error);
      activities = mockActivities;
    }
  } else {
    activities = mockActivities;
  }

  const activeActivities = activities.filter((a) => a.status === "active");

  const xml = buildRssXml(activeActivities, baseUrl);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
    },
  });
}
