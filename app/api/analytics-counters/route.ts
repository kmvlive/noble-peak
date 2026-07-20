import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllAnalyticsCounters } from "@/lib/models";
import { mockAnalyticsCounters } from "@/lib/mock-data";

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const counters = await getAllAnalyticsCounters();
      return NextResponse.json(counters);
    } catch (error) {
      console.error("Ошибка получения счётчиков:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockAnalyticsCounters);
}
