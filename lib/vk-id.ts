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
    scope: "email,phone",
    v: VK_API_VERSION,
  });
  return `https://id.vk.com/authorize?${params.toString()}`;
}

export async function exchangeVkCode(
  code: string,
  _redirectUri: string
): Promise<{
  accessToken: string;
  userId: number;
  email?: string;
  phone?: string;
}> {
  const { clientId } = getVkConfig();

  const tokenRes = await fetch(
    "https://api.vk.com/method/auth.exchangeSilentAuthToken",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        v: VK_API_VERSION,
        token: code,
        access_token: "",
        device_id: clientId,
      }),
    }
  );

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

  if (!accessToken || !userId) {
    throw new Error("VK token exchange returned no token or user_id");
  }

  let email: string | undefined;
  let phone: string | undefined;

  try {
    const userRes = await fetch("https://api.vk.com/method/users.get", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        v: VK_API_VERSION,
        access_token: accessToken,
        fields: "email,phone",
      }),
    });
    const userData = await userRes.json();
    if (userData.response?.[0]) {
      email = userData.response[0].email;
      phone = userData.response[0].phone;
    }
  } catch {
    // non-critical
  }

  return { accessToken, userId, email, phone };
}
