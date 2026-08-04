import fs from "node:fs";
import path from "node:path";

const RECEIVE_CODE_URL =
  process.env.RECEIVE_CODE_URL ?? "https://my.magazin-tour.ru/api/receive-code";
const RECEIVE_CODE_TOKEN = process.env.RECEIVE_CODE_TOKEN ?? "";

const rootDir = process.cwd();

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".sourcecraft",
  ".opencode",
  ".vibecraft",
  ".playwright-cli",
  ".playwright-mcp",
]);

const EXCLUDED_EXTENSIONS = new Set([
  ".tsbuildinfo",
  ".map",
  ".log",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
  ".woff",
  ".woff2",
  ".pem",
]);

const EXCLUDED_FILES = new Set([
  "package-lock.json",
  ".env",
  ".env.docker",
  ".env.production",
  ".env.local",
  "tsconfig.tsbuildinfo",
  ".gitignore",
  ".dockerignore",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".jsx",
  ".json",
  ".css",
  ".md",
  ".yaml",
  ".yml",
  ".mjs",
]);

function collectSources(dir: string, base = rootDir): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".") || EXCLUDED_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(base, fullPath);

    if (entry.isDirectory()) {
      results.push(...collectSources(fullPath, base));
      continue;
    }

    if (EXCLUDED_FILES.has(entry.name)) {
      continue;
    }

    const ext = path.extname(entry.name);
    if (!ALLOWED_EXTENSIONS.has(ext) || EXCLUDED_EXTENSIONS.has(ext)) {
      continue;
    }

    results.push(relativePath);
  }

  return results;
}

function buildPayload(): { path: string; content: string }[] {
  const relativePaths = collectSources(rootDir);
  const files = relativePaths.map((relativePath) => {
    const content = fs.readFileSync(path.join(rootDir, relativePath), "utf-8");
    return { path: relativePath.split(path.sep).join("/"), content };
  });
  return files;
}

async function deliver(files: { path: string; content: string }[]) {
  if (!RECEIVE_CODE_TOKEN) {
    throw new Error(
      "RECEIVE_CODE_TOKEN не задан. Укажите его в переменных окружения."
    );
  }

  const response = await fetch(RECEIVE_CODE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RECEIVE_CODE_TOKEN}`,
    },
    body: JSON.stringify({ files }),
  });

  const body = (await response.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      `Доставка не удалась (${response.status}): ${body.error ?? body.message ?? "неизвестная ошибка"}`
    );
  }

  return body;
}

async function main() {
  const files = buildPayload();

  console.log(`📦 Собираю исходные файлы из ${rootDir}...`);
  console.log(`   Найдено файлов для доставки: ${files.length}`);

  const totalBytes = files.reduce(
    (acc, f) => acc + Buffer.byteLength(f.content),
    0
  );
  console.log(`   Общий размер: ${(totalBytes / 1024).toFixed(1)} КБ`);

  console.log(`🚀 Отправляю на ${RECEIVE_CODE_URL}...`);

  const body = await deliver(files);

  console.log("✅ " + (body.message ?? "Доставка завершена"));
}

main().catch((error) => {
  console.error("❌ Ошибка доставки кода:");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
