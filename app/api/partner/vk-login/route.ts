import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getPartnerByEmail, createPartner, updatePartner } from "@/lib/models";
import { createPartnerToken } from "@/lib/partner-auth";
import { exchangeVkCode } from "@/lib/vk-id";
import { randomBytes } from "node:crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, redirectUri } = body;

    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: "code и redirectUri обязательны" },
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

    const { accessToken, userId, email } = await exchangeVkCode(
      code,
      redirectUri
    );

    const existingByVk = await getPartnerByEmail(`vk_${userId}`);
    if (existingByVk) {
      await updatePartner(existingByVk.email, {
        vkAccessToken: accessToken,
      });
      const token = createPartnerToken(existingByVk.email);
      const response = NextResponse.json({
        success: true,
        token,
        partner: {
          name: existingByVk.name,
          phone: existingByVk.phone,
          email: existingByVk.email,
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
    }

    const placeholderEmail = `vk_${userId}`;
    const existingByEmail = email ? await getPartnerByEmail(email) : null;

    if (existingByEmail) {
      await updatePartner(existingByEmail.email, {
        vkUserId: String(userId),
        vkAccessToken: accessToken,
      });
      const token = createPartnerToken(existingByEmail.email);
      const response = NextResponse.json({
        success: true,
        token,
        partner: {
          name: existingByEmail.name,
          phone: existingByEmail.phone,
          email: existingByEmail.email,
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
    }

    const partner = await createPartner({
      email: placeholderEmail,
      name: email?.split("@")[0] || `Пользователь VK ${userId}`,
      phone: "",
      passwordHash: randomBytes(32).toString("hex"),
      vkUserId: String(userId),
      vkAccessToken: accessToken,
    });

    const token = createPartnerToken(partner.email);
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка сервера";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
