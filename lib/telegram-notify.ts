import { getClientByEmail, getPartnerByEmail } from "@/lib/models";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export async function sendTelegramNotification(
  recipientEmail: string,
  title: string,
  message: string
): Promise<void> {
  const client = await getClientByEmail(recipientEmail);
  if (client?.telegramNotificationsEnabled && client?.telegramChatId) {
    await sendTelegramMessage(client.telegramChatId, title, message);
    return;
  }

  const partner = await getPartnerByEmail(recipientEmail);
  if (partner?.telegramNotificationsEnabled && partner?.telegramChatId) {
    await sendTelegramMessage(partner.telegramChatId, title, message);
  }
}

async function sendTelegramMessage(
  chatId: string,
  title: string,
  message: string
): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) return;

  try {
    const text = `<b>${escapeHtml(title)}</b>\n\n${escapeHtml(message)}`;
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      console.error("Telegram API error:", data);
    }
  } catch (e) {
    console.error("Failed to send Telegram notification:", e);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
