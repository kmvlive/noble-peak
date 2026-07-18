import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { verifyToken } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("file") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "Файлы не найдены" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const urls: string[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            error: `Недопустимый тип файла: ${file.type}. Разрешены: JPEG, PNG, WebP, GIF`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Файл слишком большой: ${file.name}. Максимум 10 MB` },
          { status: 400 }
        );
      }

      const ext = file.name.split(".").pop() || "jpg";
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = path.join(uploadDir, uniqueName);

      const bytes = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));

      urls.push(`/uploads/${uniqueName}`);
    }

    return NextResponse.json({ urls }, { status: 201 });
  } catch (error) {
    console.error("Ошибка загрузки файла:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки файла" },
      { status: 500 }
    );
  }
}
