export const VK_API_VERSION = "5.131";

export function getVkConfig() {
  const clientId = process.env.VK_CLIENT_ID!;
  const clientSecret = process.env.VK_CLIENT_SECRET!;
  const baseUrl = process.env.BASE_URL || "http://localhost:8080";

  if (!clientId || !clientSecret) {
    throw new Error("VK_CLIENT_ID and VK_CLIENT_SECRET must be set");
  }

  return { clientId, clientSecret, baseUrl };
}

export function getVkAuthUrl(redirectUri: string, state: string): string {
  const { clientId } = getVkConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "email,phone,messages",
    v: VK_API_VERSION,
  });
  return `https://id.vk.com/authorize?${params.toString()}`;
}

export async function exchangeVkCode(
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  userId: number;
  email?: string;
  phone?: string;
}> {
  const { clientId, clientSecret } = getVkConfig();

  const tokenRes = await fetch("https://oauth.vk.com/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`VK token exchange failed: ${text}`);
  }

  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    throw new Error(
      `VK token exchange error: ${tokenData.error_description || tokenData.error}`
    );
  }

  const accessToken = tokenData.access_token;
  const userId = tokenData.user_id;
  const email = tokenData.email;

  if (!accessToken || !userId) {
    throw new Error("VK token exchange returned no token or user_id");
  }

  return { accessToken, userId, email };
}
