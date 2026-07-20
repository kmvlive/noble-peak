import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getActivitiesByStatus } from "@/lib/models";
import { mockPendingActivities } from "@/lib/mock-data";

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const activities = await getActivitiesByStatus("pending");
      return NextResponse.json(activities);
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
