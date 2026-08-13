import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllActivities, getAllSections } from "@/lib/models";
import type { ActivityRecord, SectionRecord } from "@/lib/models";
import { mockActivities, mockSections } from "@/lib/mock-data";

function belongsToSection(
  activitySection: string | undefined,
  section: SectionRecord
): boolean {
  if (!activitySection) return false;
  return (
    activitySection === section.category ||
    activitySection === section.id ||
    activitySection === section.name
  );
}

function sectionsWithActiveActivities(
  sections: SectionRecord[],
  activities: ActivityRecord[]
): SectionRecord[] {
  return sections.filter((section) =>
    activities.some(
      (activity) =>
        activity.status === "active" &&
        belongsToSection(activity.section, section)
    )
  );
}

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  const headers = {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
  };

  if (dbAvailable) {
    try {
      const [sections, activities] = await Promise.all([
        getAllSections(),
        getAllActivities(),
      ]);
      return NextResponse.json(
        sectionsWithActiveActivities(sections, activities),
        { headers }
      );
    } catch (error) {
      console.error("Ошибка получения разделов:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    sectionsWithActiveActivities(mockSections, mockActivities),
    { headers }
  );
}
