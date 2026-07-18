import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getClientBookings } from "@/lib/models";
import { getClientEmailFromRequest } from "@/lib/client-auth";
import { mockBookings } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    const clientEmail = getClientEmailFromRequest(request);
    if (!clientEmail) {
      return NextResponse.json(
        { error: "Необходимо авторизоваться" },
        { status: 401 }
      );
    }

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json({ bookings: mockBookings });
    }

    const bookings = await getClientBookings(clientEmail);
    return NextResponse.json({ bookings });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
