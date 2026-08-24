/**
 * Публичный вход интеграции с Bnovo: регистрирует адаптер в реестре каналов
 * и экспортирует функции синхронизации для вызова из API-маршрутов.
 */

import { registerChannelSyncAdapter } from "@/lib/channels";
import { bnovoAdapter } from "./adapter";

export * from "./client";
export * from "./sync";

registerChannelSyncAdapter(bnovoAdapter);

export const BNOVO_CHANNEL_TYPE = "bnovo" as const;
