import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllSections } from "@/lib/models";
import { mockSections } from "@/lib/mock-data";

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const sections = await getAllSections();
      return NextResponse.json(sections);
    } catch (error) {
      console.error("Ошибка получения разделов:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockSections);
}
