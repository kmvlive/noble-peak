import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getPartnerByEmail, getActivitiesByPartnerEmail } from "@/lib/models";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const { email } = await params;

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const partner = await getPartnerByEmail(email);
      if (!partner) {
        return NextResponse.json(
          { error: "Партнёр не найден" },
          { status: 404 }
        );
      }

      const activities = await getActivitiesByPartnerEmail(email);
      const activeActivities = activities.filter((a) => a.status === "active");

      return NextResponse.json({
        email: partner.email,
        name: partner.name,
        photo: partner.photo ?? "",
        description: partner.description ?? "",
        activities: activeActivities.map((a) => ({
          id: a.id,
          title: a.title,
          shortDescription: a.shortDescription,
          price: a.price,
          location: a.location,
          imageGradient: a.imageGradient,
          section: a.section,
        })),
      });
    } catch (error) {
      console.error("Ошибка получения профиля партнёра:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных" },
        { status: 500 }
      );
    }
  }

  const { mockPartners, mockPartnerActivities } =
    await import("@/lib/mock-data");
  const mock = mockPartners.find((p) => p.email === email);
  if (!mock) {
    return NextResponse.json({ error: "Партнёр не найден" }, { status: 404 });
  }

  const activeActivities = mockPartnerActivities.filter(
    (a) => a.status === "active"
  );

  return NextResponse.json({
    email: mock.email,
    name: mock.name,
    photo: mock.photo ?? "",
    description: mock.description ?? "",
    activities: activeActivities.map((a) => ({
      id: a.id,
      title: a.title,
      shortDescription: a.shortDescription,
      price: a.price,
      location: a.location,
      imageGradient: a.imageGradient,
      section: a.section,
    })),
  });
}
