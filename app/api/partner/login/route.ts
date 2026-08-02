import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getPartnerByEmail } from "@/lib/models";
import { verifyPassword, createPartnerToken } from "@/lib/partner-auth";

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

    const partner = await getPartnerByEmail(email);
    if (!partner) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    if (!verifyPassword(password, partner.passwordHash)) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    if (partner.blocked) {
      return NextResponse.json(
        { error: "Ваш аккаунт заблокирован. Обратитесь к администратору." },
        { status: 403 }
      );
    }

    const token = createPartnerToken(email);

    const response = NextResponse.json({
      success: true,
      token,
      partner: {
        name: partner.name,
        phone: partner.phone,
        email: partner.email,
      },
    });
    response.cookies.set("partner_token", token, {
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
