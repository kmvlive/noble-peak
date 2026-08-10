import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getAgentByEmail,
  getPartnersByAgent,
  getAgentCommissionRateForMonth,
  updateAgent,
} from "@/lib/models";
import { mockAgents, mockPartners } from "@/lib/mock-data";
import { verifyToken, isMainAdminPayload } from "@/lib/auth";

const updateSchema = z.object({
  blocked: z.boolean(),
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);

  const dbAvailable = await isDatabaseAvailable();
  const agent = dbAvailable
    ? await getAgentByEmail(email)
    : (mockAgents.find((a) => a.email === email) ?? null);

  if (!agent) {
    return NextResponse.json({ error: "Агент не найден" }, { status: 404 });
  }

  const partners = dbAvailable
    ? await getPartnersByAgent(email)
    : mockPartners.filter((p) => p.agentEmail === email);

  const partnerList = partners.map((p) => ({
    email: p.email,
    name: p.name,
    phone: p.phone,
    partnerNumber: p.partnerNumber ?? "",
  }));

  const agentInfo = {
    email: agent.email,
    name: agent.name,
    phone: agent.phone,
    code: agent.code,
    blocked: Boolean(agent.blocked),
    createdAt: agent.createdAt,
    bankDetails: agent.bankDetails ?? null,
    currentRatePercent: dbAvailable
      ? Math.round((await getAgentCommissionRateForMonth(email)) * 100)
      : 3,
    partnersCount: partnerList.length,
  };

  return NextResponse.json({ agent: agentInfo, partners: partnerList });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await getAgentByEmail(email);
    if (!existing) {
      return NextResponse.json({ error: "Агент не найден" }, { status: 404 });
    }

    const updated = await updateAgent(email, {
      blocked: parsed.data.blocked,
    });

    return NextResponse.json({
      email: updated.email,
      blocked: Boolean(updated.blocked),
    });
  } catch {
    return NextResponse.json(
      { error: "Ошибка обновления агента" },
      { status: 500 }
    );
  }
}
