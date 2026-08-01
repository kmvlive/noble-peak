import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllActivities, getAllSections } from "@/lib/models";
import { mockActivities, mockSections } from "@/lib/mock-data";
import type { ActivityRecord, SectionRecord } from "@/lib/models";

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
  section: SectionRecord,
  baseUrl: string
): string {
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
    <title>${escapeXml(section.name)} — Магазин туров и активностей</title>
    <link>${escapeXml(baseUrl)}/sections/${escapeXml(section.id)}</link>
    <description>${escapeXml(section.description)}</description>
    <language>ru</language>
    <atom:link href="${escapeXml(baseUrl)}/sections/${escapeXml(section.id)}/rss.xml" rel="self" type="application/rss+xml"/>
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

  let sections: SectionRecord[];
  let activities: ActivityRecord[];

  if (dbAvailable) {
    try {
      [sections, activities] = await Promise.all([
        getAllSections(),
        getAllActivities(),
      ]);
    } catch (error) {
      console.error("Ошибка получения данных для RSS раздела:", error);
      sections = mockSections;
      activities = mockActivities;
    }
  } else {
    sections = mockSections;
    activities = mockActivities;
  }

  const section = sections.find((s) => s.id === slug);
  if (!section) notFound();

  const sectionActivities = activities.filter(
    (a) =>
      a.status === "active" &&
      (a.section === section.category ||
        a.section === section.id ||
        a.section === section.name)
  );

  const xml = buildRssXml(sectionActivities, section, baseUrl);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
    },
  });
}
