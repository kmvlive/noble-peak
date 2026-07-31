import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { getClientByEmail, createClient } from "@/lib/models";
import { hashPassword, createClientToken } from "@/lib/client-auth";
import { sendEmail } from "@/lib/email";
import { appName } from "@/lib/app-name";

const registerSchema = z.object({
  name: z.string().min(1, "Имя обязательно").max(100),
  phone: z.string().min(1, "Телефон обязателен").max(20),
  email: z.string().email("Некорректный email"),
  password: z
    .string()
    .min(6, "Пароль должен быть не менее 6 символов")
    .max(100),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Некорректные данные",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { name, phone, email, password } = parsed.data;

    const dbAvailable = await isDatabaseAvailable();

    if (!dbAvailable) {
      return NextResponse.json(
        { error: "База данных недоступна. Попробуйте позже." },
        { status: 503 }
      );
    }

    const existing = await getClientByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже зарегистрирован" },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);
    const client = await createClient({
      email,
      name,
      phone,
      passwordHash,
    });

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

    sendEmail({
      to: email,
      subject: `Добро пожаловать в ${appName}`,
      html: `
        <h1>Добро пожаловать, ${name}!</h1>
        <p>Вы успешно зарегистрировались в ${appName}.</p>
        <p>Ваши регистрационные данные:</p>
        <ul>
          <li><strong>Имя:</strong> ${name}</li>
          <li><strong>Телефон:</strong> ${phone}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Пароль:</strong> ${password}</li>
        </ul>
        <p>Рекомендуем сменить пароль после первого входа.</p>
        <p>С уважением, команда ${appName}.</p>
      `,
    }).catch((err) => {
      console.error("Ошибка отправки email клиенту:", err);
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
