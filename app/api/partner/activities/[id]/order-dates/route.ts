import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getActivityById, getOrderedDatesByActivityId } from "@/lib/models";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const { id } = await params;
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json({ dates: [] });
  }

  try {
    const activity = await getActivityById(id);
    if (!activity || activity.partnerEmail !== partnerEmail) {
      return NextResponse.json(
        { error: "Активность не найдена" },
        { status: 404 }
      );
    }

    const dates = await getOrderedDatesByActivityId(id);
    return NextResponse.json({ dates });
  } catch (error) {
    console.error("Ошибка получения дат с заказами:", error);
    return NextResponse.json(
      { error: "Ошибка получения дат с заказами" },
      { status: 500 }
    );
  }
}
