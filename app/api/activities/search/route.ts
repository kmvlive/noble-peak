import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllActivities, getAllSections } from "@/lib/models";
import { mockActivities, mockSections } from "@/lib/mock-data";
import type { ActivityRecord } from "@/lib/models";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const city = searchParams.get("city") || "";
  const section = searchParams.get("section") || "";
  const budgetMin = searchParams.get("budget_min");
  const budgetMax = searchParams.get("budget_max");

  const dbAvailable = await isDatabaseAvailable();

  let activities: ActivityRecord[];
  const sectionNameMap: Record<string, string> = {};

  if (dbAvailable) {
    try {
      const [allActivities, allSections] = await Promise.all([
        getAllActivities(),
        getAllSections(),
      ]);
      activities = allActivities;
      for (const s of allSections) {
        sectionNameMap[s.category] = s.name;
      }
    } catch (error) {
      console.error("Error fetching data for search:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных" },
        { status: 500 }
      );
    }
  } else {
    activities = mockActivities;
    for (const s of mockSections) {
      sectionNameMap[s.category] = s.name;
    }
  }

  const qLower = q.toLowerCase();
  const cityLower = city.toLowerCase();
  const sectionLower = section.toLowerCase();
  const min = budgetMin ? parseFloat(budgetMin) : undefined;
  const max = budgetMax ? parseFloat(budgetMax) : undefined;

  const cityRelevant =
    cityLower !== "" &&
    !cityLower.includes("не важно") &&
    !cityLower.includes("неважн");

  const sectionRelevant =
    sectionLower !== "" &&
    !sectionLower.includes("не важно") &&
    !sectionLower.includes("неважн");

  const qRelevant =
    qLower !== "" && !qLower.includes("не важно") && !qLower.includes("неважн");

  const filtered = activities.filter((a) => {
    const sectionName = (sectionNameMap[a.section] || a.section).toLowerCase();
    const titleLower = a.title.toLowerCase();
    const shortDesc = a.shortDescription.toLowerCase();
    const location = (a.location || "").toLowerCase();
    const fullText = `${titleLower} ${shortDesc} ${sectionName} ${location}`;

    let qMatch = true;
    if (qRelevant) {
      qMatch =
        fullText.includes(qLower) ||
        sectionName.includes(qLower) ||
        qLower
          .split(" ")
          .some((word) => word.length > 2 && fullText.includes(word));
    }

    let cityMatch = true;
    if (cityRelevant) {
      cityMatch =
        location.includes(cityLower) ||
        cityLower
          .split(" ")
          .some((word) => word.length > 2 && location.includes(word));
    }

    let sectionMatch = true;
    if (sectionRelevant) {
      sectionMatch =
        sectionName.includes(sectionLower) ||
        sectionLower
          .split(" ")
          .some((word) => word.length > 2 && sectionName.includes(word));
    }

    let budgetMatch = true;
    if (min !== undefined && max !== undefined) {
      budgetMatch = a.price >= min && a.price <= max;
    } else if (min !== undefined) {
      budgetMatch = a.price >= min;
    } else if (max !== undefined) {
      budgetMatch = a.price <= max;
    }

    return qMatch && cityMatch && sectionMatch && budgetMatch;
  });

  return NextResponse.json({ activities: filtered, sectionNameMap });
}
