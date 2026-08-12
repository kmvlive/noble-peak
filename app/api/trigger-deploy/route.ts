import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export async function GET(request: NextRequest) {
  return handleTriggerDeploy(request);
}

export async function POST(request: NextRequest) {
  return handleTriggerDeploy(request);
}

async function handleTriggerDeploy(request: NextRequest) {
  try {
    const webhooksPath = path.join(
      process.cwd(),
      ".sourcecraft",
      "webhooks.yaml"
    );

    let secret: string | undefined;

    try {
      const raw = fs.readFileSync(webhooksPath, "utf-8");
      const data = yaml.load(raw) as {
        webhooks?: { hooks?: Array<{ secret?: string }> };
      };
      const webhook = data?.webhooks?.hooks?.[0];
      secret = webhook?.secret;
    } catch {
      return NextResponse.json(
        { error: "Не удалось прочитать webhooks.yaml" },
        { status: 500 }
      );
    }

    if (secret && /^\$\{\{\s*secrets\.([A-Z0-9_]+)\s*\}\}$/.test(secret)) {
      const name = secret.match(/^\$\{\{\s*secrets\.([A-Z0-9_]+)\s*\}\}$/)?.[1];
      secret = name ? process.env[name] : undefined;
    }

    if (!secret) {
      return NextResponse.json(
        { error: "Секрет деплоя не найден в webhooks.yaml или окружении" },
        { status: 500 }
      );
    }

    const origin = new URL(request.url).origin;
    const deployUrl = `${origin}/api/deploy`;

    const deployResponse = await fetch(deployUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
    });

    const body = await deployResponse.json();

    return NextResponse.json(body, { status: deployResponse.status });
  } catch (error) {
    console.error("Ошибка trigger-deploy:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
