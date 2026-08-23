import path from "node:path";
import { config as loadEnv } from "dotenv";

export function loadEnvForScript(): void {
  const nodeEnv = process.env.NODE_ENV ?? "development";

  if (nodeEnv === "production") {
    loadEnv({ path: path.resolve(process.cwd(), ".env.production") });
    return;
  }

  loadEnv({ path: path.resolve(process.cwd(), ".env.docker") });
  loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
  loadEnv({ path: path.resolve(process.cwd(), ".env") });
}
