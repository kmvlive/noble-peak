import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getAgentByEmail } from "@/lib/models";
import { verifyPassword, createAgentToken } from "@/lib/agent-auth";

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

    const agent = await getAgentByEmail(email);
    if (!agent) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    if (!verifyPassword(password, agent.passwordHash)) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    if (agent.blocked) {
      return NextResponse.json(
        { error: "Ваш аккаунт заблокирован. Обратитесь к администратору." },
        { status: 403 }
      );
    }

    const token = createAgentToken(email);

    const response = NextResponse.json({
      success: true,
      token,
      agent: {
        name: agent.name,
        phone: agent.phone,
        email: agent.email,
        code: agent.code,
      },
    });
    response.cookies.set("agent_token", token, {
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
