import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getClientByEmail } from "@/lib/models";
import { verifyPassword, createClientToken } from "@/lib/client-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email и пароль обязательны" },
        { status: 400 }
      );
    }

    const dbAvailable = await isDatabaseAvailable();

    if (!dbAvailable) {
      return NextResponse.json(
        { error: "База данных недоступна. Попробуйте позже." },
        { status: 503 }
      );
    }

    const client = await getClientByEmail(email);
    if (!client) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    if (!verifyPassword(password, client.passwordHash)) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    const token = createClientToken(email);

    const response = NextResponse.json({
      success: true,
      token,
      client: { name: client.name, phone: client.phone, email: client.email },
    });
    response.cookies.set("client_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
