import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { getAllSections, createSection, deleteSection } from "@/lib/models";
import { mockSections } from "@/lib/mock-data";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

const createSectionSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().default(""),
  icon: z.string().max(100).optional().default("FolderOpen"),
  imageGradient: z.string().optional().default("from-blue-400 to-indigo-500"),
  category: z.string().min(1).max(200),
});

const deleteSectionSchema = z.object({
  id: z.string().min(1),
});

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.cookies.get("admin_token");
  return cookie?.value ?? null;
}

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const sections = await getAllSections();
      return NextResponse.json(sections);
    } catch (error) {
      console.error("Ошибка получения разделов:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockSections);
}

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
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
    const parsed = createSectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const section = await createSection(parsed.data);

    revalidateTag("sections", "max");

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания раздела:", error);
    return NextResponse.json(
      { error: "Ошибка создания раздела" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
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
    const parsed = deleteSectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await deleteSection(parsed.data.id);
    revalidateTag("sections", "max");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления раздела:", error);
    return NextResponse.json(
      { error: "Ошибка удаления раздела" },
      { status: 500 }
    );
  }
}
