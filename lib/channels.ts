import type {
  ListingCalendarRecord,
  ListingBookingRecord,
  ListingChannelConnection,
  ListingChannelType,
  ListingDateStatus,
  ListingRecord,
} from "@noble-peak/shared";

export type ChannelCredentialFieldType = "text" | "password";

export interface ChannelCredentialField {
  key: string;
  label: string;
  placeholder?: string;
  type: ChannelCredentialFieldType;
  required?: boolean;
}

export interface ChannelManagerDefinition {
  type: ListingChannelType;
  name: string;
  description: string;
  credentialFields: ChannelCredentialField[];
}

/**
 * Каркас под синхронизацию календаря с менеджерами каналов.
 * Реальная синхронизация реализуется отдельным этапом через адаптеры,
 * которые регистрируются в реестре без изменений ядра календаря.
 */
export const CHANNEL_MANAGERS: ChannelManagerDefinition[] = [
  {
    type: "realtycalendar",
    name: "RealtyCalendar",
    description: "Синхронизация календаря и броней через RealtyCalendar",
    credentialFields: [
      {
        key: "apiKey",
        label: "API-ключ",
        placeholder: "Введите API-ключ аккаунта",
        type: "password",
        required: true,
      },
    ],
  },
  {
    type: "travelline",
    name: "TravelLine",
    description: "Синхронизация календаря и броней через TravelLine",
    credentialFields: [
      {
        key: "apiKey",
        label: "API-ключ",
        placeholder: "Введите API-ключ аккаунта",
        type: "password",
        required: true,
      },
    ],
  },
  {
    type: "bnovo",
    name: "Bnovo",
    description: "Синхронизация календаря и броней через Bnovo",
    credentialFields: [
      {
        key: "login",
        label: "Логин",
        placeholder: "Введите логин аккаунта",
        type: "text",
        required: true,
      },
      {
        key: "password",
        label: "Пароль",
        placeholder: "Введите пароль аккаунта",
        type: "password",
        required: true,
      },
    ],
  },
  {
    type: "agast",
    name: "Агаст",
    description: "Синхронизация календаря и броней через Агаст",
    credentialFields: [
      {
        key: "apiKey",
        label: "API-ключ",
        placeholder: "Введите API-ключ аккаунта",
        type: "password",
        required: true,
      },
    ],
  },
];

export function getChannelManager(
  type: ListingChannelType
): ChannelManagerDefinition | undefined {
  return CHANNEL_MANAGERS.find((c) => c.type === type);
}

export interface ChannelCalendarEntry {
  unitId: string;
  date: string;
  status: ListingDateStatus;
}

export interface ChannelSyncContext {
  listing: ListingRecord;
  calendars: ListingCalendarRecord[];
  bookings: ListingBookingRecord[];
}

export interface ChannelSyncResult {
  imported: ChannelCalendarEntry[];
  pushed: number;
}

/**
 * Контракт двухсторонней синхронизации с менеджером канала.
 * Каждый канал подключается через собственную реализацию адаптера,
 * которая регистрируется в реестре — ядро календаря при этом не меняется.
 */
export interface ChannelSyncAdapter {
  type: ListingChannelType;
  pull(
    context: ChannelSyncContext,
    connection: ListingChannelConnection
  ): Promise<ChannelSyncResult>;
  push(
    context: ChannelSyncContext,
    connection: ListingChannelConnection
  ): Promise<ChannelSyncResult>;
}

const channelSyncAdapters = new Map<ListingChannelType, ChannelSyncAdapter>();

export function registerChannelSyncAdapter(adapter: ChannelSyncAdapter): void {
  channelSyncAdapters.set(adapter.type, adapter);
}

export function getChannelSyncAdapter(
  type: ListingChannelType
): ChannelSyncAdapter | undefined {
  return channelSyncAdapters.get(type);
}
