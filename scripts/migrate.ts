import {
  DynamoDBClient,
  CreateTableCommand,
  ListTablesCommand,
  DescribeTableCommand,
  UpdateTableCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { TABLE_SCHEMAS, TABLE_NAMES } from "../lib/schema";

const client = new DynamoDBClient({
  endpoint: process.env.DOCUMENT_API_ENDPOINT,
  region: process.env.DOCUMENT_API_REGION ?? "ru-central1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

const TABLES = TABLE_NAMES.map((name) => TABLE_SCHEMAS[name]);

async function migrate() {
  console.log("🔧 Запуск миграций DynamoDB...");

  const { TableNames = [] } = await client.send(new ListTablesCommand({}));

  for (const table of TABLES) {
    if (TableNames.includes(table.name)) {
      console.log(`  ✓ Таблица существует: ${table.name}`);

      if (table.globalSecondaryIndexes?.length) {
        const desc = await client.send(
          new DescribeTableCommand({ TableName: table.name })
        );
        const existingIndexes =
          desc.Table?.GlobalSecondaryIndexes?.map((i) => i.IndexName) ?? [];

        for (const gsi of table.globalSecondaryIndexes) {
          if (!existingIndexes.includes(gsi.IndexName)) {
            console.log(`    Добавление индекса ${gsi.IndexName}...`);
            await client.send(
              new UpdateTableCommand({
                TableName: table.name,
                AttributeDefinitions: table.attributeDefinitions,
                GlobalSecondaryIndexUpdates: [
                  {
                    Create: {
                      IndexName: gsi.IndexName,
                      KeySchema: gsi.KeySchema,
                      Projection: gsi.Projection,
                    },
                  },
                ],
              })
            );
            console.log(`    ✓ Индекс ${gsi.IndexName} добавлен`);
          }
        }
      }

      continue;
    }

    console.log(`  Создание таблицы: ${table.name}...`);

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

    console.log(`  Ожидание активации ${table.name}...`);
    await waitUntilTableExists(
      { client, maxWaitTime: 120 },
      { TableName: table.name }
    );

    console.log(`  ✓ Создана: ${table.name}`);
  }

  console.log("🎉 Миграции завершены!");
}

migrate().catch((e) => {
  console.error("❌ Ошибка миграции:", e);
  process.exit(1);
});
