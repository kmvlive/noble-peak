import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { getClientByEmail, updateClient } from "@/lib/models";
import { verifyClientToken, hashPassword } from "@/lib/client-auth";

const setPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = setPasswordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    const email = verifyClientToken(token);
    if (!email) {
      return NextResponse.json(
        { error: "Недействительный токен" },
        { status: 401 }
      );
    }

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "База данных недоступна" },
        { status: 503 }
      );
    }

    const client = await getClientByEmail(email);
    if (!client) {
      return NextResponse.json({ error: "Клиент не найден" }, { status: 404 });
    }

    const passwordHash = hashPassword(password);

    await updateClient(email, { passwordHash });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
