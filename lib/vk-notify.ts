import { VK_API_VERSION } from "@/lib/vk-id";
import { getClientByEmail, getPartnerByEmail } from "@/lib/models";

export async function sendVkNotification(
  recipientEmail: string,
  title: string,
  message: string
): Promise<void> {
  const client = await getClientByEmail(recipientEmail);
  if (
    client?.vkNotificationsEnabled &&
    client?.vkAccessToken &&
    client?.vkUserId
  ) {
    await sendVkMessage(client.vkAccessToken, client.vkUserId, title, message);
    return;
  }

  const partner = await getPartnerByEmail(recipientEmail);
  if (
    partner?.vkNotificationsEnabled &&
    partner?.vkAccessToken &&
    partner?.vkUserId
  ) {
    await sendVkMessage(
      partner.vkAccessToken,
      partner.vkUserId,
      title,
      message
    );
  }
}

async function sendVkMessage(
  accessToken: string,
  userId: string,
  title: string,
  message: string
): Promise<void> {
  try {
    const text = `${title}\n${message}`;
    const params = new URLSearchParams({
      access_token: accessToken,
      v: VK_API_VERSION,
      user_id: userId,
      message: text,
      random_id: String(Date.now()),
    });

    const res = await fetch(
      `https://api.vk.com/method/messages.send?${params}`,
      {
        method: "POST",
      }
    );

    const data = await res.json();
    if (data.error) {
      console.error("VK API error sending notification:", data.error);
    }
  } catch (e) {
    console.error("Failed to send VK notification:", e);
  }
}
