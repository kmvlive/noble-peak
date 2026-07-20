import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getPasswordResetToken,
  markPasswordResetTokenUsed,
} from "@/lib/models";

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

    if (resetRecord.role !== "client") {
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

    const { hashPassword } = await import("@/lib/client-auth");
    const { getClientByEmail, updateClient } = await import("@/lib/models");

    const client = await getClientByEmail(resetRecord.email);
    if (!client) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const passwordHash = hashPassword(password);

    await updateClient(resetRecord.email, {});

    const { docClient } = await import("@/lib/db");
    const { UpdateCommand } = await import("@aws-sdk/lib-dynamodb");
    const { TableName } = await import("@/lib/schema");
    await docClient.send(
      new UpdateCommand({
        TableName: TableName.CLIENTS,
        Key: { email: resetRecord.email },
        UpdateExpression: "set passwordHash = :passwordHash",
        ExpressionAttributeValues: { ":passwordHash": passwordHash },
      })
    );

    await markPasswordResetTokenUsed(token);

    return NextResponse.json({
      success: true,
      message: "Пароль успешно изменён",
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
