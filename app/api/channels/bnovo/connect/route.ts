import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";
import { saveChannelSyncRecord } from "@/lib/models";
import {
  BnovoClient,
  getBnovoWebhookUrl,
  getBnovoWebhookBaseUrl,
} from "@/lib/channels/bnovo";

const connectSchema = z.object({
  connectionId: z.string().min(1).max(200),
  listingId: z.string().min(1).max(200),
  login: z.string().min(1).max(200),
  password: z.string().min(1).max(500),
  propertyId: z.string().optional(),
  planId: z.string().optional(),
  mapping: z.record(z.string(), z.string()).optional(),
});

export async function POST(request: NextRequest) {
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 }
    );
  }

  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const parsed = connectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    connectionId,
    listingId,
    login,
    password,
    propertyId,
    planId,
    mapping,
  } = parsed.data;

  const client = new BnovoClient(login, password);

  try {
    // 1. Авторизация через JWT (POST /api/v1/auth).
    await client.authenticate();

    // 2. Забираем типы комнат и тарифы для построения маппинга.
    const [roomTypes, tariffs] = await Promise.allSettled([
      client.getRoomTypes(),
      client.getTariffs(),
    ]);
    const discoveredRoomTypes =
      roomTypes.status === "fulfilled" && Array.isArray(roomTypes.value)
        ? roomTypes.value
        : [];
    const discoveredTariffs =
      tariffs.status === "fulfilled" && Array.isArray(tariffs.value)
        ? tariffs.value
        : [];

    const resolvedPlanId = planId || String(discoveredTariffs[0]?.id ?? "");

    // 3. Регистрация вебхуков booking и plans_data_update.
    const webhookUrl = getBnovoWebhookUrl();
    const webhooks = await client.getWebhooks().catch(() => []);
    const existing = Array.isArray(webhooks) ? webhooks : [];
    let webhookRegistered = existing.length > 0;
    let webhookId = existing[0]?.id ? String(existing[0].id) : undefined;
    for (const type of ["booking", "plans_data_update"]) {
      const found = existing.find(
        (w) =>
          w.type === type &&
          String(w.url ?? "").startsWith(getBnovoWebhookBaseUrl())
      );
      if (found) continue;
      try {
        const created = await client.createWebhook({ type, url: webhookUrl });
        webhookRegistered = true;
        if (created?.id) webhookId = String(created.id);
      } catch (err) {
        console.error("Ошибка регистрации вебхука Bnovo:", err);
      }
    }

    // 4. Сохраняем состояние подключения.
    await saveChannelSyncRecord({
      connectionId,
      listingId,
      channelType: "bnovo",
      propertyId,
      planId: resolvedPlanId,
      mapping,
      token: client.cachedToken ?? undefined,
      tokenExpiresAt: new Date(Date.now() + 3600_000).toISOString(),
      webhookRegistered,
      webhookId,
      lastSyncAt: new Date().toISOString(),
      lastError: undefined,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      roomTypes: discoveredRoomTypes,
      tariffs: discoveredTariffs,
      webhookRegistered,
      webhookUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось подключить Bnovo";
    console.error("Ошибка подключения Bnovo:", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const dynamic = "force-dynamic";
