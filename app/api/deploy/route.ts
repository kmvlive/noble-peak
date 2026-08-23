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
  const githubToken = process.env.GITHUB_TOKEN;
  const deployRepo = process.env.DEPLOY_REPO || "artkmv1/noble-peak";
  const deployRepoUrl =
    process.env.DEPLOY_REPO_URL ||
    (githubToken
      ? `https://artkmv1:${githubToken}@github.com/${deployRepo}.git`
      : `https://github.com/${deployRepo}.git`);
  const commands = [
    `cd "${cwd}"`,
    `echo "🔄 Настройка git remote artkmv1 (${deployRepo})..."`,
    `git remote set-url artkmv1 "${deployRepoUrl}" 2>/dev/null || git remote add artkmv1 "${deployRepoUrl}"`,
    `git remote set-url artkmv1 "${deployRepoUrl}"`,
    "echo '✓ Remote artkmv1 настроен'",
    "echo '🔄 git fetch из artkmv1/noble-peak (ветка main)...'",
    "git fetch artkmv1 main",
    "echo '✓ git fetch выполнен'",
    "echo '🔄 Переключение на main и синхронизация с artkmv1...'",
    "git checkout -f main",
    "git reset --hard artkmv1/main",
    "echo '✓ Код получен из artkmv1/noble-peak (main)'",
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
