import { NextResponse } from "next/server";
import type { ActivityRecord } from "@/lib/models";

export const revalidate = 60;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildRss(
  cityName: string,
  activities: ActivityRecord[],
  baseUrl: string
): string {
  const displayName = cityName.replace(/^г\.\s*/, "");
  const channelLink = `${baseUrl}/locations/${encodeURIComponent(cityName)}`;

  const itemsXml = activities
    .map((a) => {
      const itemLink = `${baseUrl}/activities/${a.id}`;
      const description = `${escapeXml(a.shortDescription)}<br/>Цена: ${a.price.toLocaleString("ru-RU")} ₽`;
      const pubDate = new Date(a.createdAt).toUTCString();

      return `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(itemLink)}</link>
      <guid>${escapeXml(itemLink)}</guid>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <price>${a.price}</price>
    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(displayName)} — активности и развлечения</title>
    <link>${escapeXml(channelLink)}</link>
    <description>Активности и развлечения в ${escapeXml(displayName)}</description>
    <language>ru</language>
    <atom:link href="${escapeXml(channelLink + "/rss.xml")}" rel="self" type="application/rss+xml"/>
    ${itemsXml}
  </channel>
</rss>`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ city: string }> }
) {
  const { city } = await params;
  const cityDecoded = decodeURIComponent(city);
  const baseUrl = process.env.BASE_URL || "http://localhost:8080";

  const activitiesRes = await fetch(`${baseUrl}/api/activities`, {
    next: { revalidate: 60, tags: ["activities"] },
  });

  if (!activitiesRes.ok) {
    return NextResponse.json(
      { error: "Ошибка получения данных" },
      { status: 500 }
    );
  }

  const activities: ActivityRecord[] = await activitiesRes.json();

  const cityLower = cityDecoded.toLowerCase().replace(/^г\.\s*/, "");
  const cityFullLower = cityDecoded.toLowerCase();

  const cityActivities = activities
    .filter((a) => {
      const loc = (a.location || "").toLowerCase();
      return loc.includes(cityFullLower) || loc.includes(cityLower);
    })
    .slice(0, 25);

  if (cityActivities.length === 0) {
    return NextResponse.json({ error: "Город не найден" }, { status: 404 });
  }

  const rss = buildRss(cityDecoded, cityActivities, baseUrl);

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
    },
  });
}
