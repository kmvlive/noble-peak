import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getActivitiesByStatus,
  getPartnerByEmail,
  getAgentCommissionRateForMonth,
} from "@/lib/models";
import { mockPendingActivities } from "@/lib/mock-data";

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const activities = await getActivitiesByStatus("pending");
      const enriched = await Promise.all(
        activities.map(async (activity) => {
          let agentCommissionPercent = 0;
          if (activity.partnerEmail) {
            const partner = await getPartnerByEmail(activity.partnerEmail);
            if (partner?.agentEmail) {
              const rate = await getAgentCommissionRateForMonth(
                partner.agentEmail
              );
              agentCommissionPercent = Math.round(rate * 100);
            }
          }
          return { ...activity, agentCommissionPercent };
        })
      );
      return NextResponse.json(enriched);
    } catch (error) {
      console.error("Ошибка получения pending активностей:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockPendingActivities);
}
