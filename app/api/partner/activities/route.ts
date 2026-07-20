import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getActivitiesByPartnerEmail } from "@/lib/models";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";
import { mockPartnerActivities } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const activities = await getActivitiesByPartnerEmail(partnerEmail);
      return NextResponse.json(activities);
    } catch (error) {
      console.error("Ошибка получения активностей партнёра:", error);
      return NextResponse.json(
        { error: "Ошибка загрузки активностей" },
        { status: 500 }
      );
    }
  }

  const filtered = mockPartnerActivities.filter(
    (a) => a.partnerEmail === partnerEmail
  );
  return NextResponse.json(filtered);
}
