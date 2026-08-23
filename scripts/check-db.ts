import { spawnSync } from "node:child_process";
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { loadEnvForScript } from "./lib/load-env";

loadEnvForScript();

const client = new DynamoDBClient({
  endpoint: process.env.DOCUMENT_API_ENDPOINT,
  region: process.env.DOCUMENT_API_REGION ?? "ru-central1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

async function checkHealth(): Promise<void> {
  console.log("🧪 Проверка доступности БД (DynamoDB)...");
  try {
    await client.send(new ListTablesCommand({}));
    console.log("  ✓ БД доступна");
  } catch (error) {
    console.error(
      "  ❌ БД недоступна:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

function runStep(args: string[]): void {
  const result = spawnSync("npx", ["tsx", ...args], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main(): Promise<void> {
  console.log("🔧 Автоматическая проверка и починка БД перед деплоем...");

  await checkHealth();

  console.log("🔍 Сверка схемы таблиц (ключи и GSI)...");
  runStep(["scripts/verify-schema.ts"]);

  console.log("🔢 Прогон миграций...");
  runStep(["scripts/migrate.ts"]);

  console.log(
    "✅ БД готова к работе: доступна, схема актуальна, миграции применены"
  );
}

main().catch((error) => {
  console.error("❌ Ошибка проверки БД:", error);
  process.exit(1);
});
