import { NextRequest, NextResponse } from "next/server";
import { getClientEmailFromRequest } from "@/lib/client-auth";
import { getClientByEmail } from "@/lib/models";
import { isDatabaseAvailable } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const email = getClientEmailFromRequest(request);
    if (!email) {
      return NextResponse.json(
        { error: "Необходимо авторизоваться" },
        { status: 401 }
      );
    }

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { client: { name: "Пользователь", phone: "", email } },
        { status: 200 }
      );
    }

    const client = await getClientByEmail(email);
    if (!client) {
      return NextResponse.json({ error: "Клиент не найден" }, { status: 404 });
    }

    return NextResponse.json({
      client: {
        name: client.name,
        phone: client.phone,
        email: client.email,
      },
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
