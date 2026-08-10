import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getAllAgents,
  getPartnersByAgent,
  getAgentSettings,
  getAgentCommissionRateForMonth,
  saveAgentSettings,
} from "@/lib/models";
import { mockAgents, mockAgentSettings } from "@/lib/mock-data";
import { verifyToken, isMainAdminPayload } from "@/lib/auth";

const settingsSchema = z.object({
  tier2Threshold: z.number().min(0),
  tier3Threshold: z.number().min(0),
});

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.cookies.get("admin_token");
  return cookie?.value ?? null;
}

function authorized(request: NextRequest): boolean {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  return Boolean(payload && isMainAdminPayload(payload));
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  const agents = dbAvailable ? await getAllAgents() : mockAgents;
  const settings = dbAvailable
    ? await getAgentSettings()
    : (mockAgentSettings.find((s) => s.id === "ladder") ?? null);

  const settingsWithDefaults = settings ?? {
    id: "ladder",
    tier2Threshold: 100000,
    tier3Threshold: 300000,
    updatedAt: "",
  };

  const list = await Promise.all(
    agents.map(async (a) => {
      const partners = dbAvailable
        ? await getPartnersByAgent(a.email)
        : mockAgents.filter((x) => x.email === a.email);
      return {
        email: a.email,
        name: a.name,
        phone: a.phone,
        code: a.code,
        blocked: Boolean(a.blocked),
        createdAt: a.createdAt,
        partnersCount: partners.length,
        currentRatePercent: dbAvailable
          ? Math.round((await getAgentCommissionRateForMonth(a.email)) * 100)
          : 3,
      };
    })
  );

  return NextResponse.json({ agents: list, settings: settingsWithDefaults });
}

export async function PUT(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.tier3Threshold <= parsed.data.tier2Threshold) {
      return NextResponse.json(
        { error: "Порог 5% должен быть больше порога 4%" },
        { status: 400 }
      );
    }

    const settings = await saveAgentSettings({
      tier2Threshold: parsed.data.tier2Threshold,
      tier3Threshold: parsed.data.tier3Threshold,
    });
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { error: "Ошибка сохранения настроек" },
      { status: 500 }
    );
  }
}
