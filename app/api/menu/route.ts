import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getMenuItems } from "@/lib/models";
import { mockMenuItems } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const menuType = searchParams.get("type");

  if (!menuType || !["admin", "client", "partner"].includes(menuType)) {
    return NextResponse.json(
      { error: "Некорректный тип меню" },
      { status: 400 }
    );
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const items = await getMenuItems(
        menuType as "admin" | "client" | "partner"
      );
      return NextResponse.json(items);
    } catch (error) {
      console.error("Ошибка получения пунктов меню:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  const filtered = mockMenuItems.filter((item) => item.menuType === menuType);
  return NextResponse.json(filtered);
}
