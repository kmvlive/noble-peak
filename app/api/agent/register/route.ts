import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { getAgentByEmail, getAgentByCode, createAgent } from "@/lib/models";
import {
  hashPassword,
  createAgentToken,
  generateAgentCode,
} from "@/lib/agent-auth";
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

    const existing = await getAgentByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Агент с таким email уже зарегистрирован" },
        { status: 409 }
      );
    }

    let code = generateAgentCode();
    while (await getAgentByCode(code)) {
      code = generateAgentCode();
    }

    const passwordHash = hashPassword(password);
    const agent = await createAgent({
      email,
      name,
      phone,
      passwordHash,
      code,
    });

    const token = createAgentToken(email);

    const baseUrl = process.env.BASE_URL ?? "http://localhost:8080";

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

    sendEmail({
      to: email,
      subject: `Добро пожаловать в кабинет агента ${appName}`,
      html: `
        <h1>Добро пожаловать, ${name}!</h1>
        <p>Поздравляем! Вы успешно зарегистрировались в кабинете агента ${appName}.</p>
        <p>Ваши регистрационные данные:</p>
        <ul>
          <li><strong>Имя:</strong> ${name}</li>
          <li><strong>Телефон:</strong> ${phone}</li>
          <li><strong>Логин (email):</strong> ${email}</li>
          <li><strong>Пароль:</strong> ${password}</li>
          <li><strong>Код агента:</strong> ${code}</li>
        </ul>
        <p>Ваша партнёрская ссылка для привлечения партнёров: <a href="${baseUrl}/partner/login?ref=${code}">${baseUrl}/partner/login?ref=${code}</a></p>
        <p>Для входа в кабинет агента перейдите по ссылке: <a href="${baseUrl}/agent/login">${baseUrl}/agent/login</a></p>
        <p>С уважением, команда ${appName}.</p>
      `,
    }).catch((err) => {
      console.error("Ошибка отправки email агенту:", err);
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
