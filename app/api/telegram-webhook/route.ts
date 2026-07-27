import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

export async function POST(request: NextRequest) {
  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "Бот не настроен" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const message = body.message;

    if (!message || !message.text || !message.chat) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    if (text === "/start") {
      const responseText =
        "Добро пожаловать! Ваш Telegram ID: " +
        chatId +
        "\n\nСкопируйте этот ID и вставьте в настройках уведомлений на сайте Noble Peak, чтобы получать уведомления в Telegram.";

      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: responseText,
          }),
        }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
