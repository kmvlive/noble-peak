import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getClientByEmail, createClient, updateClient } from "@/lib/models";
import { createClientToken } from "@/lib/client-auth";
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

    const existingByVk = await getClientByEmail(`vk_${userId}`);
    if (existingByVk) {
      await updateClient(existingByVk.email, { vkAccessToken: accessToken });
      const token = createClientToken(existingByVk.email);
      const response = NextResponse.json({
        success: true,
        token,
        client: {
          name: existingByVk.name,
          phone: existingByVk.phone,
          email: existingByVk.email,
        },
      });
      response.cookies.set("client_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }

    const placeholderEmail = `vk_${userId}`;
    const existingByEmail = email ? await getClientByEmail(email) : null;

    if (existingByEmail) {
      await updateClient(existingByEmail.email, {
        vkUserId: String(userId),
        vkAccessToken: accessToken,
      });
      const token = createClientToken(existingByEmail.email);
      const response = NextResponse.json({
        success: true,
        token,
        client: {
          name: existingByEmail.name,
          phone: existingByEmail.phone,
          email: existingByEmail.email,
        },
      });
      response.cookies.set("client_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }

    const client = await createClient({
      email: placeholderEmail,
      name: email?.split("@")[0] || `Пользователь VK ${userId}`,
      phone: "",
      passwordHash: randomBytes(32).toString("hex"),
      vkUserId: String(userId),
      vkAccessToken: accessToken,
    });

    const token = createClientToken(client.email);
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка сервера";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
