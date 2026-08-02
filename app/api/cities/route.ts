import { NextRequest, NextResponse } from "next/server";
import { RUSSIAN_CITIES } from "@/lib/russian-cities";
import { getAllCities, createCity } from "@/lib/models";
import { isDatabaseAvailable } from "@/lib/db";
import { z } from "zod";

const createCitySchema = z.object({
  name: z.string().min(1).max(200),
});

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.toLowerCase().trim() ?? "";

  const staticResults = q
    ? RUSSIAN_CITIES.filter((city) => city.toLowerCase().includes(q))
    : [];

  let dbCities: string[] = [];
  if (await isDatabaseAvailable()) {
    try {
      const records = await getAllCities();
      dbCities = records.map((c) => c.name);
    } catch {
      // DB unavailable, skip
    }
  }

  const dbFiltered = q
    ? dbCities.filter((name) => name.toLowerCase().includes(q))
    : dbCities;

  const merged = [...new Set([...staticResults, ...dbFiltered])].slice(0, 50);

  return NextResponse.json(merged);
}

export async function POST(request: NextRequest) {
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 }
    );
  }

  const parsed = createCitySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const city = await createCity(parsed.data.name);
    return NextResponse.json(city, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Город уже существует" },
      { status: 409 }
    );
  }
}
