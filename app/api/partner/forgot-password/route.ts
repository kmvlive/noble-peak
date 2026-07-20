import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { isDatabaseAvailable } from "@/lib/db";
import { createPasswordResetToken } from "@/lib/models";
import { getPartnerByEmail } from "@/lib/models";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = forgotPasswordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректный email" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    const dbAvailable = await isDatabaseAvailable();
    let partner = null;
    if (dbAvailable) {
      partner = await getPartnerByEmail(email);
    } else {
      const { mockPartners } = await import("@/lib/mock-data");
      partner =
        mockPartners.find((p: { email: string }) => p.email === email) ?? null;
    }

    if (!partner) {
      return NextResponse.json({
        success: true,
        message: "Если email зарегистрирован, вы получите письмо",
      });
    }

    const token = await createPasswordResetToken(email, "partner");
    const baseUrl = process.env.BASE_URL || "http://localhost:8080";
    const resetLink = `${baseUrl}/partner/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Восстановление пароля — Кабинет партнёра",
      html: `<p>Здравствуйте, ${partner.name}!</p>
<p>Вы запросили восстановление пароля для входа в кабинет партнёра.</p>
<p>Для сброса пароля перейдите по ссылке:</p>
<p><a href="${resetLink}">${resetLink}</a></p>
<p>Ссылка действительна в течение 1 часа.</p>
<p>Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.</p>`,
    });

    return NextResponse.json({
      success: true,
      message: "Если email зарегистрирован, вы получите письмо",
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
