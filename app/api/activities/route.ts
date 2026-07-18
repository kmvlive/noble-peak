import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllActivities } from "@/lib/models";
import { mockActivities } from "@/lib/mock-data";

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const activities = await getAllActivities();
      return NextResponse.json(activities);
    } catch (error) {
      console.error("Ошибка получения активностей:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockActivities);
}
