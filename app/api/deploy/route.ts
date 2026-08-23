import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export async function POST(request: NextRequest) {
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

  const cwd = process.cwd();
  const commands = [
    `cd "${cwd}"`,
    "echo '🔄 git pull...'",
    "git pull",
    "echo '✓ git pull выполнен'",
    "echo '📦 npm install (включая dev-зависимости)...'",
    "npm install --include=dev",
    "echo '✓ npm install выполнен'",
    "echo '🏗️ npm run build...'",
    "npm run build",
    "echo '✓ npm run build выполнен'",
    "echo '🔍 Проверка и исправление схемы DynamoDB...'",
    "npm run db:verify",
    "echo '✓ Схема DynamoDB проверена'",
    "echo '🔄 PM2 restart...'",
    "pm2 restart all",
    "echo '✓ Деплой завершён'",
  ].join(" && ");

  const child = spawn("sh", ["-c", commands], {
    cwd,
    stdio: "ignore",
    detached: true,
  });

  child.unref();

  return NextResponse.json({
    success: true,
    message: "Деплой запущен в фоновом режиме",
  });
}
