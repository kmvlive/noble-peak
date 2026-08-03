import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getInfoPagesByTarget } from "@/lib/models";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";
import { mockInfoPages } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const pages = await getInfoPagesByTarget("partner");
      return NextResponse.json(pages);
    } catch (error) {
      console.error("Ошибка получения информации для партнёров:", error);
      return NextResponse.json(
        { error: "Ошибка загрузки информации" },
        { status: 500 }
      );
    }
  }

  const filtered = mockInfoPages.filter((p) => p.target === "partner");
  return NextResponse.json(filtered);
}
