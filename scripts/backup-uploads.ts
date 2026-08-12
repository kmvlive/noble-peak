import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const UPLOADS_DIR = path.join(ROOT, "public", "uploads");
const BACKUP_ROOT = path.join(ROOT, "backups", "uploads");
const MAX_BACKUPS = 30;

function run(cmd: string, args: string[]): boolean {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env: process.env,
  });
  return result.status === 0;
}

function ensureUploadsDir(): void {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function createBackup(): string | null {
  if (!existsSync(BACKUP_ROOT)) {
    mkdirSync(BACKUP_ROOT, { recursive: true });
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const archive = path.join(BACKUP_ROOT, `uploads-${stamp}.tar.gz`);
  const hasFiles = readdirSync(UPLOADS_DIR).some((name) => name !== ".gitkeep");

  if (
    run("tar", ["-czf", archive, "-C", path.dirname(UPLOADS_DIR), "uploads"])
  ) {
    console.log(
      `  ✓ Создан бэкап загруженных файлов: ${path.relative(ROOT, archive)}`
    );
    if (!hasFiles) {
      console.log("  ℹ️ В uploads только пустой каталог, бэкап пуст");
    }
    return archive;
  }

  console.error("  ❌ Не удалось создать бэкап загруженных файлов");
  return null;
}

function pruneOldBackups(): void {
  const files = readdirSync(BACKUP_ROOT)
    .filter((name) => name.startsWith("uploads-") && name.endsWith(".tar.gz"))
    .sort()
    .reverse();

  for (const file of files.slice(MAX_BACKUPS)) {
    rmSync(path.join(BACKUP_ROOT, file), { force: true });
    console.log(`  ♻️ Удалён старый бэкап: ${file}`);
  }
}

function isGitRepo(): boolean {
  const result = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
    stdio: "pipe",
  });
  return result.status === 0;
}

function hasUploadsChanges(): boolean {
  const result = spawnSync(
    "git",
    ["status", "--porcelain", "--", "public/uploads"],
    { stdio: "pipe", encoding: "utf8" }
  );
  return result.status === 0 && (result.stdout ?? "").trim().length > 0;
}

function commitUploads(): void {
  if (!isGitRepo()) {
    console.log("  ℹ️ Не git-репозиторий — авто-коммит пропущен");
    return;
  }

  if (!hasUploadsChanges()) {
    console.log("  ℹ️ Изменений в public/uploads нет — коммит не требуется");
    return;
  }

  run("git", ["add", "public/uploads"]);
  const ok = run("git", [
    "commit",
    "-m",
    "chore(uploads): авто-коммит загруженных файлов",
    "--no-verify",
  ]);

  if (ok) {
    console.log("  ✓ Загруженные файлы закоммичены в git");
  } else {
    console.error("  ⚠️ Не удалось выполнить авто-коммит загруженных файлов");
  }
}

function main(): void {
  console.log("💾 Авто-бэкап и авто-коммит загружаемых файлов...");

  ensureUploadsDir();

  const archive = createBackup();
  if (archive) {
    pruneOldBackups();
  }

  commitUploads();

  console.log("✅ Бэкап и авто-коммит завершены");
}

main();
