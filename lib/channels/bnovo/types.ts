/**
 * Типы данных API v2 Bnovo (https://api.pms.bnovo.ru).
 * Поля выбраны толерантно к необязательности — реальные ответы могут
 * отличаться в зависимости от версии и прав аккаунта.
 */

export interface BnovoAuthResponse {
  token?: string;
  access_token?: string;
  /** Время жизни токена в секундах (если приходит от канала). */
  expires_in?: number;
  error?: string;
  message?: string;
}

export interface BnovoBookingGuest {
  name?: string;
  phone?: string;
  email?: string;
}

export interface BnovoBooking {
  id: string | number;
  date_from: string;
  date_to: string;
  room_type_id?: string | number;
  room_id?: string | number;
  property_id?: string | number;
  status?: string;
  plan_id?: string | number;
  guest?: BnovoBookingGuest;
  guests?: BnovoBookingGuest[];
  guest_count?: number;
  source?: string;
  external_id?: string;
  [key: string]: unknown;
}

export interface BnovoRoomType {
  id: string | number;
  name?: string;
  property_id?: string | number;
  [key: string]: unknown;
}

export interface BnovoRoom {
  id: string | number;
  name?: string;
  room_type_id?: string | number;
  [key: string]: unknown;
}

export interface BnovoTariff {
  id: string | number;
  name?: string;
  property_id?: string | number;
  [key: string]: unknown;
}

export interface BnovoClosedDate {
  date?: string;
  room_id?: string | number;
  [key: string]: unknown;
}

export interface BnovoWebhookSubscriber {
  id?: string | number;
  type?: string;
  url?: string;
  active?: boolean;
  [key: string]: unknown;
}

/** Событие вебхука Bnovo, передаваемое на наш сервер. */
export interface BnovoWebhookEvent {
  type?: string;
  booking?: BnovoBooking;
  booking_id?: string | number;
  room_type_id?: string | number;
  property_id?: string | number;
  date_from?: string;
  date_to?: string;
  plan_id?: string | number;
  [key: string]: unknown;
}

/** Результат ответа с возможной ошибкой канала. */
export interface BnovoApiError {
  code: number;
  message: string;
  fields?: string[];
}
