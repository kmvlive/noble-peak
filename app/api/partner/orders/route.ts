import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getActivitiesByPartnerEmail,
  getBookingsByActivityIds,
} from "@/lib/models";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";
import { mockPartnerActivities, mockPartnerBookings } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const activities = await getActivitiesByPartnerEmail(partnerEmail);
      const activityIds = activities.map((a) => a.id);
      const bookings = await getBookingsByActivityIds(activityIds);
      return NextResponse.json(bookings);
    } catch (error) {
      console.error("Ошибка получения заказов партнёра:", error);
      return NextResponse.json(
        { error: "Ошибка загрузки заказов" },
        { status: 500 }
      );
    }
  }

  const partnerActivityIds = mockPartnerActivities
    .filter((a) => a.partnerEmail === partnerEmail)
    .map((a) => a.id);
  const filtered = mockPartnerBookings.filter((b) =>
    partnerActivityIds.includes(b.activityId)
  );
  return NextResponse.json(filtered);
}
