import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getPartnerByEmail,
  getLinksByPartner,
  getPendingLinksByPartner,
} from "@/lib/models";
import { getPartnerEmailFromRequest } from "@/lib/partner-auth";
import { mockPartners, mockPartnerLinks } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const partnerEmail = getPartnerEmailFromRequest(request);
  if (!partnerEmail) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    const mock = mockPartners.find((p) => p.email === partnerEmail);
    const links = mockPartnerLinks.filter(
      (l) => l.partnerEmail === partnerEmail
    );
    return NextResponse.json({
      partnerNumber: mock?.partnerNumber ?? "",
      agentEmail: mock?.agentEmail ?? null,
      pendingLinks: links.filter((l) => l.status === "pending"),
      links,
    });
  }

  try {
    const partner = await getPartnerByEmail(partnerEmail);
    if (!partner) {
      return NextResponse.json({ error: "Партнёр не найден" }, { status: 404 });
    }

    const [links, pendingLinks] = await Promise.all([
      getLinksByPartner(partnerEmail),
      getPendingLinksByPartner(partnerEmail),
    ]);

    return NextResponse.json({
      partnerNumber: partner.partnerNumber ?? "",
      agentEmail: partner.agentEmail ?? null,
      pendingLinks,
      links,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
