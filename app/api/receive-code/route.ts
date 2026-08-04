import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { z } from "zod";

const fileSchema = z.object({
  path: z.string().min(1, "path is required"),
  content: z.string(),
});

const jsonSchema = z.object({
  files: z.array(fileSchema).min(1, "At least one file is required"),
});

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

function isPathSafe(targetPath: string): boolean {
  const resolved = path.resolve(process.cwd(), targetPath);
  return resolved.startsWith(process.cwd());
}

async function writeFiles(files: { path: string; content: string }[]) {
  for (const file of files) {
    const resolvedPath = path.resolve(process.cwd(), file.path);

    if (!isPathSafe(file.path)) {
      throw new Error(`Path traversal detected: ${file.path}`);
    }

    await mkdir(path.dirname(resolvedPath), { recursive: true });
    await writeFile(resolvedPath, file.content, "utf-8");
  }
}

function triggerBuild() {
  const cwd = process.cwd();
  const composeFile =
    process.env.RECEIVE_CODE_COMPOSE_FILE ?? "docker-compose.prod.yml";
  const commands = [
    `cd "${cwd}"`,
    // На сервере приложение реально запущено через docker compose.
    // Если docker-compose.prod.yml существует — пересобираем и перезапускаем
    // контейнер, иначе (локально / PM2) — собираем и перезапускаем через PM2.
    `if [ -f "${composeFile}" ]; then`,
    "  echo '🏗️ docker compose build...'",
    `  docker compose -f ${composeFile} build`,
    "  echo '✓ Build completed'",
    "  echo '🔄 docker compose up --force-recreate...'",
    `  docker compose -f ${composeFile} up -d --force-recreate`,
    "  echo '✓ Container restarted'",
    "else",
    "  echo '🏗️ npm run build...'",
    "  npm run build",
    "  echo '✓ Build completed'",
    "  echo '🔄 PM2 restart...'",
    "  pm2 restart all || (npm run build && npm run start &)",
    "  echo '✓ Restart complete'",
    "fi",
  ].join("\n");

  const child = spawn("sh", ["-c", commands], {
    cwd,
    stdio: "ignore",
    detached: true,
  });

  child.unref();
}

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const expectedToken = process.env.RECEIVE_CODE_TOKEN;

  if (!expectedToken) {
    return NextResponse.json(
      { error: "RECEIVE_CODE_TOKEN not configured on server" },
      { status: 500 }
    );
  }

  if (!token || token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let files: { path: string; content: string }[] = [];

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const parsed = jsonSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          {
            error: "Invalid request body",
            details: parsed.error.flatten(),
          },
          { status: 400 }
        );
      }

      files = parsed.data.files;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const fileEntries = formData.getAll("file") as File[];

      if (!fileEntries.length) {
        return NextResponse.json(
          { error: "No files found in form data" },
          { status: 400 }
        );
      }

      for (const file of fileEntries) {
        const filePath = file.name;
        if (!filePath) {
          return NextResponse.json(
            { error: "Each file must have a name (target path)" },
            { status: 400 }
          );
        }
        const content = await file.text();
        files.push({ path: filePath, content });
      }
    } else {
      return NextResponse.json(
        {
          error:
            "Unsupported Content-Type. Use application/json or multipart/form-data",
        },
        { status: 400 }
      );
    }

    await writeFiles(files);

    triggerBuild();

    return NextResponse.json({
      success: true,
      message: `Written ${files.length} file(s), build and restart triggered`,
      files: files.map((f) => f.path),
    });
  } catch (error) {
    console.error("Error in receive-code:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
