import {
  DynamoDBClient,
  ListTablesCommand,
  DescribeTableCommand,
  CreateTableCommand,
  DeleteTableCommand,
  UpdateTableCommand,
  ScanCommand,
  BatchWriteItemCommand,
  type AttributeValue,
  type KeySchemaElement,
  type GlobalSecondaryIndex,
} from "@aws-sdk/client-dynamodb";
import { TABLE_SCHEMAS, TABLE_NAMES, type TableSchema } from "../lib/schema";

type Item = Record<string, AttributeValue>;

const client = new DynamoDBClient({
  endpoint: process.env.DOCUMENT_API_ENDPOINT,
  region: process.env.DOCUMENT_API_REGION ?? "ru-central1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

const TABLES: TableSchema[] = TABLE_NAMES.map((name) => TABLE_SCHEMAS[name]);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const indexName = (gsi: GlobalSecondaryIndex): string => gsi.IndexName ?? "";

function keySchemasEqual(
  a: KeySchemaElement[] | undefined,
  b: KeySchemaElement[] | undefined
): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every(
    (el, i) =>
      b[i]?.AttributeName === el.AttributeName && b[i]?.KeyType === el.KeyType
  );
}

async function waitForTableGone(tableName: string): Promise<void> {
  for (let i = 0; i < 60; i++) {
    try {
      await client.send(new DescribeTableCommand({ TableName: tableName }));
    } catch (e) {
      if ((e as { name?: string }).name === "ResourceNotFoundException") return;
      throw e;
    }
    await delay(5000);
  }
  throw new Error(`Превышено время ожидания удаления ${tableName}`);
}

async function waitForIndexStatus(
  tableName: string,
  index: string,
  status: "ACTIVE" | "DELETING"
): Promise<boolean> {
  for (let i = 0; i < 120; i++) {
    const desc = await client.send(
      new DescribeTableCommand({ TableName: tableName })
    );
    const idx = desc.Table?.GlobalSecondaryIndexes?.find(
      (i) => i.IndexName === index
    );
    if (status === "DELETING" && !idx) return true;
    if (idx?.IndexStatus === "ACTIVE") return true;
    await delay(5000);
  }
  return false;
}

async function collectItems(tableName: string): Promise<Item[]> {
  const items: Item[] = [];
  let lastEvaluatedKey: Record<string, AttributeValue> | undefined;
  do {
    const res = await client.send(
      new ScanCommand({
        TableName: tableName,
        ...(lastEvaluatedKey ? { ExclusiveStartKey: lastEvaluatedKey } : {}),
      })
    );
    if (res.Items?.length) items.push(...res.Items);
    lastEvaluatedKey = res.LastEvaluatedKey;
  } while (lastEvaluatedKey);
  return items;
}

async function restoreItems(tableName: string, items: Item[]): Promise<void> {
  const keyAttrs =
    TABLES.find((t) => t.name === tableName)?.keySchema.map(
      (k) => k.AttributeName
    ) ?? [];

  for (let start = 0; start < items.length; start += 25) {
    const slice = items.slice(start, start + 25);
    const batch = slice.filter((item) =>
      keyAttrs.every((attr) => attr !== undefined && item[attr] !== undefined)
    );
    const skipped = slice.length - batch.length;
    if (skipped > 0) {
      console.log(
        `    Пропущено ${skipped} элементов (нет ключевых атрибутов)`
      );
    }
    if (batch.length === 0) continue;
    await client.send(
      new BatchWriteItemCommand({
        RequestItems: {
          [tableName]: batch.map((item) => ({ PutRequest: { Item: item } })),
        },
      })
    );
  }
}

async function recreateTable(table: TableSchema): Promise<void> {
  console.log(`  ♻️ Пересоздание ${table.name}: сохранение данных...`);
  const items = await collectItems(table.name);

  console.log(`  Удаление таблицы ${table.name}...`);
  await client.send(new DeleteTableCommand({ TableName: table.name }));
  await waitForTableGone(table.name);

  console.log(`  Создание таблицы ${table.name} с правильным ключом...`);
  await client.send(
    new CreateTableCommand({
      TableName: table.name,
      KeySchema: table.keySchema,
      AttributeDefinitions: table.attributeDefinitions,
      ...(table.globalSecondaryIndexes?.length
        ? { GlobalSecondaryIndexes: table.globalSecondaryIndexes }
        : {}),
      BillingMode: "PAY_PER_REQUEST",
    })
  );
  await delay(5000);

  if (items.length) {
    console.log(`  Восстановление ${items.length} элементов...`);
    await restoreItems(table.name, items);
  }
  console.log(`  ✓ ${table.name} пересоздана`);
}

async function addMissingGsi(table: TableSchema): Promise<void> {
  const desc = await client.send(
    new DescribeTableCommand({ TableName: table.name })
  );
  const existingIndexes = desc.Table?.GlobalSecondaryIndexes ?? [];

  for (const gsi of table.globalSecondaryIndexes ?? []) {
    const name = indexName(gsi);
    if (!name) throw new Error(`GSI без имени у таблицы ${table.name}`);

    const existing = existingIndexes.find((i) => i.IndexName === name);

    if (!existing) {
      console.log(`    Добавление GSI ${name} к ${table.name}...`);
      await client.send(
        new UpdateTableCommand({
          TableName: table.name,
          AttributeDefinitions: table.attributeDefinitions,
          GlobalSecondaryIndexUpdates: [
            {
              Create: {
                IndexName: name,
                KeySchema: gsi.KeySchema ?? [],
                Projection: gsi.Projection,
              },
            },
          ],
        })
      );
      const ok = await waitForIndexStatus(table.name, name, "ACTIVE");
      if (!ok) throw new Error(`Таймаут создания GSI ${name}`);
      console.log(`    ✓ GSI ${name} добавлен`);
      continue;
    }

    if (!keySchemasEqual(existing.KeySchema, gsi.KeySchema)) {
      console.log(`    Пересоздание GSI ${name} (неверный ключ)...`);
      await client.send(
        new UpdateTableCommand({
          TableName: table.name,
          GlobalSecondaryIndexUpdates: [{ Delete: { IndexName: name } }],
        })
      );
      await waitForIndexStatus(table.name, name, "DELETING");

      await client.send(
        new UpdateTableCommand({
          TableName: table.name,
          AttributeDefinitions: table.attributeDefinitions,
          GlobalSecondaryIndexUpdates: [
            {
              Create: {
                IndexName: name,
                KeySchema: gsi.KeySchema ?? [],
                Projection: gsi.Projection,
              },
            },
          ],
        })
      );
      const ok = await waitForIndexStatus(table.name, name, "ACTIVE");
      if (!ok) throw new Error(`Таймаут пересоздания GSI ${name}`);
      console.log(`    ✓ GSI ${name} пересоздан`);
    }
  }
}

async function verify() {
  console.log("🔍 Проверка и исправление схемы таблиц DynamoDB...");

  const { TableNames = [] } = await client.send(new ListTablesCommand({}));
  let changed = false;

  for (const table of TABLES) {
    if (!TableNames.includes(table.name)) {
      console.log(`  Создание недостающей таблицы: ${table.name}...`);
      await client.send(
        new CreateTableCommand({
          TableName: table.name,
          KeySchema: table.keySchema,
          AttributeDefinitions: table.attributeDefinitions,
          ...(table.globalSecondaryIndexes?.length
            ? { GlobalSecondaryIndexes: table.globalSecondaryIndexes }
            : {}),
          BillingMode: "PAY_PER_REQUEST",
        })
      );
      await delay(5000);
      changed = true;
      continue;
    }

    const desc = await client.send(
      new DescribeTableCommand({ TableName: table.name })
    );
    const actualKey = desc.Table?.KeySchema;

    if (!keySchemasEqual(actualKey, table.keySchema)) {
      console.log(
        `  ⚠️  Неверный ключ таблицы ${table.name}. Ожидается: ${table.keySchema
          .map((k) => `${k.AttributeName}:${k.KeyType}`)
          .join(", ")}`
      );
      await recreateTable(table);
      changed = true;
      continue;
    }

    await addMissingGsi(table);
  }

  if (changed) {
    console.log("👌 Схема всех таблиц исправлена");
  } else {
    console.log("✅ Схема всех таблиц уже актуальна, исправления не нужны");
  }
}

verify().catch((e) => {
  console.error("❌ Ошибка проверки схемы:", e);
  process.exit(1);
});
