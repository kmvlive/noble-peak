import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getPasswordResetToken,
  markPasswordResetTokenUsed,
} from "@/lib/models";
import { hashAdminPassword } from "@/lib/auth";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = resetPasswordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Некорректные данные. Пароль должен содержать минимум 6 символов.",
        },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    const resetRecord = await getPasswordResetToken(token);
    if (!resetRecord) {
      return NextResponse.json(
        { error: "Недействительный или истёкший токен" },
        { status: 400 }
      );
    }

    if (resetRecord.role !== "admin") {
      return NextResponse.json(
        { error: "Недействительный токен" },
        { status: 400 }
      );
    }

    if (resetRecord.used) {
      return NextResponse.json(
        { error: "Токен уже использован" },
        { status: 400 }
      );
    }

    if (new Date(resetRecord.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Срок действия токена истёк" },
        { status: 400 }
      );
    }

    const { getAdminByEmail, updateAdmin, createAdmin } =
      await import("@/lib/models");

    const admin = await getAdminByEmail(resetRecord.email);

    if (admin) {
      await updateAdmin(resetRecord.email, {
        password: hashAdminPassword(password),
      });
    } else {
      await createAdmin({
        email: resetRecord.email,
        password: hashAdminPassword(password),
        name: "Администратор",
        role: "admin",
      });
    }

    await markPasswordResetTokenUsed(token);

    return NextResponse.json({
      success: true,
      message: "Пароль успешно изменён",
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
