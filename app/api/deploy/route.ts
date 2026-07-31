import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

function run(cmd: string, cwd?: string): { stdout: string; stderr: string } {
  const output = execSync(cmd, {
    cwd,
    timeout: 120_000,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });
  return { stdout: output, stderr: "" };
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.DEPLOY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Секрет деплоя не настроен" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json(
        { error: "Неавторизованный запрос" },
        { status: 401 }
      );
    }

    const log: string[] = [];
    const cwd = process.cwd();

    log.push("🔄 git pull...");
    run("git pull", cwd);
    log.push("✓ git pull выполнен");

    log.push("📦 npm install...");
    run("npm install", cwd);
    log.push("✓ npm install выполнен");

    log.push("🏗️ npm run build...");
    run("npm run build", cwd);
    log.push("✓ npm run build выполнен");

    log.push("🔄 Перезапуск контейнеров...");
    run(
      "docker compose -f docker-compose.prod.yml up -d --build --force-recreate",
      cwd
    );
    log.push("✓ Контейнеры перезапущены");

    return NextResponse.json({ success: true, log });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Неизвестная ошибка";
    return NextResponse.json(
      { error: "Ошибка деплоя", details: message },
      { status: 500 }
    );
  }
}
