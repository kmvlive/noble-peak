export interface Service {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive" | "deploying";
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderType = "payment" | "order_form";
export type ActivityType = "individual" | "group";
export type ActivityStatus = "active" | "pending" | "rejected";

export interface ActivityRecord {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  images: string[];
  section: string;
  price: number;
  partnerPrice?: number;
  partnerPricePercent?: number;
  likes: number;
  isPopular: boolean;
  isPromo: boolean;
  over18: boolean;
  activityType: ActivityType;
  orderType: OrderType;
  imageGradient: string;
  location?: string;
  isMultiDay?: boolean;
  languages?: string[];
  status: ActivityStatus;
  partnerEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientRecord {
  email: string;
  name: string;
  phone: string;
  passwordHash: string;
  vkUserId?: string;
  vkAccessToken?: string;
  vkNotificationsEnabled?: boolean;
  telegramChatId?: string;
  telegramNotificationsEnabled?: boolean;
  createdAt: string;
}

export interface CalendarDateEntry {
  available: boolean;
  hours?: string[];
  closed?: boolean;
}

export interface ActivityCalendarRecord {
  activityId: string;
  dates: Record<string, CalendarDateEntry>;
  updatedAt: string;
}

export interface BookingRecord {
  id: string;
  clientEmail: string;
  clientName: string;
  clientPhone: string;
  activityId: string;
  activityTitle: string;
  date: string;
  time: string | null;
  details: string;
  price: number;
  status: "pending_payment" | "confirmed" | "cancelled";
  paymentId: string | null;
  paymentUrl: string | null;
  paymentStatus: string | null;
  createdAt: string;
}

export interface SectionRecord {
  id: string;
  name: string;
  description: string;
  icon: string;
  imageGradient: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailSettingsRecord {
  id: string;
  emails: string[];
  defaultEmail: string;
  updatedAt: string;
}

export interface PaymentSettingsRecord {
  id: string;
  terminalKey: string;
  password: string;
  webhookUrl: string;
  updatedAt: string;
}

export interface AdminRecord {
  email: string;
  password: string;
  name: string;
  role: "main_admin" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface LegalData {
  country: string;
  status: "individual" | "ip" | "legal_entity";
  fullName: string;
  document: "passport_rf" | "passport_foreign";
  documentSeriesNumber: string;
  issueDate: string;
  tin: string;
}

export interface PartnerRecord {
  email: string;
  name: string;
  phone: string;
  passwordHash: string;
  photo?: string;
  description?: string;
  slug?: string;
  orderFormEnabled?: boolean;
  blocked?: boolean;
  documentNumber?: string;
  legalData?: LegalData;
  vkUserId?: string;
  vkAccessToken?: string;
  vkNotificationsEnabled?: boolean;
  telegramChatId?: string;
  telegramNotificationsEnabled?: boolean;
  agentEmail?: string;
  partnerNumber?: string;
  createdAt: string;
}

export type PartnerLinkStatus = "pending" | "accepted" | "declined";

export interface PartnerLinkRecord {
  id: string;
  agentEmail: string;
  agentName: string;
  partnerEmail: string;
  partnerName: string;
  status: PartnerLinkStatus;
  createdAt: string;
  respondedAt?: string;
}

export interface AgentBankDetails {
  fullName: string;
  bankName: string;
  bik: string;
  accountNumber: string;
  correspondentAccount: string;
  inn?: string;
}

export interface AgentRecord {
  email: string;
  name: string;
  phone: string;
  passwordHash: string;
  code: string;
  blocked?: boolean;
  bankDetails?: AgentBankDetails;
  vkNotificationsEnabled?: boolean;
  telegramChatId?: string;
  telegramNotificationsEnabled?: boolean;
  createdAt: string;
}

export interface PasswordResetRecord {
  token: string;
  email: string;
  role: "admin" | "client" | "partner";
  expiresAt: string;
  used: boolean;
}

export interface MenuItemRecord {
  id: string;
  menuType: "admin" | "client" | "partner" | "footer";
  name: string;
  url: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsCounterRecord {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  bookingId: string;
  clientEmail: string;
  clientName: string;
  clientPhone: string;
  activityId: string;
  activityTitle: string;
  partnerEmail: string | null;
  date: string;
  time: string | null;
  price: number;
  status: "pending_payment" | "paid" | "completed" | "cancelled";
  wasPaid?: boolean;
  createdAt: string;
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ReviewRecord {
  id: string;
  activityId: string;
  clientEmail: string;
  clientName: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  recipientEmail: string;
  type: "booking_status" | "new_order" | "activity_status" | "system";
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface OrderSettingsRecord {
  id: string;
  orderFormEnabled: boolean;
  updatedAt: string;
}

export interface SliderImage {
  id: string;
  imageUrl: string;
  position?: "center" | "top" | "bottom";
  createdAt: string;
}

export interface CityRecord {
  name: string;
  createdAt: string;
}

export interface ChatMessageRecord {
  id: string;
  orderId: string;
  senderEmail: string;
  senderRole: "client" | "partner";
  text: string;
  clientEmail: string;
  partnerEmail: string;
  createdAt: string;
}

export type InfoPageTarget = "partner" | "tourist" | "agent";

export interface InfoPageRecord {
  id: string;
  target: InfoPageTarget;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type PayoutStatus = "pending" | "approved" | "paid" | "declined";

export interface PayoutRecord {
  id: string;
  number: string;
  agentEmail: string;
  agentName: string;
  amount: number;
  month: string;
  status: PayoutStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AgentStatsRecord {
  agentEmail: string;
  clicks30: number;
  registrations30: number;
  updatedAt: string;
}

export interface AgentClickRecord {
  id: string;
  agentEmail: string;
  createdAt: string;
}

export interface AgentSettingsRecord {
  id: string;
  tier2Threshold: number;
  tier3Threshold: number;
  updatedAt: string;
}

export type HousingType = "rooms" | "apartments" | "houses" | "separate_rooms";

export interface HousingSubtype {
  value: string;
  label: string;
}

export interface HousingTypeDefinition {
  value: HousingType;
  label: string;
  subtypes: HousingSubtype[];
}

export const HOUSING_TYPES: HousingTypeDefinition[] = [
  {
    value: "rooms",
    label: "Номера / спальные места",
    subtypes: [
      { value: "hotel", label: "Гостиница" },
      { value: "resort", label: "Отель" },
      { value: "hostel", label: "Хостел" },
      { value: "guest_house", label: "Гостевой дом" },
      { value: "base", label: "Турбаза" },
      { value: "bed", label: "Спальное место" },
    ],
  },
  {
    value: "apartments",
    label: "Квартиры / апартаменты целиком",
    subtypes: [
      { value: "apartment", label: "Квартира" },
      { value: "apartments", label: "Апартаменты" },
      { value: "studio", label: "Студия" },
    ],
  },
  {
    value: "houses",
    label: "Дома / коттеджи целиком",
    subtypes: [
      { value: "cottage", label: "Коттедж" },
      { value: "house", label: "Дом" },
      { value: "dacha", label: "Дача" },
      { value: "villa", label: "Вилла" },
      { value: "townhouse", label: "Таунхаус" },
    ],
  },
  {
    value: "separate_rooms",
    label: "Отдельные комнаты",
    subtypes: [
      { value: "room_in_apartment", label: "Комната в квартире" },
      { value: "room_in_house", label: "Комната в доме" },
      { value: "room_in_hostel", label: "Комната в хостеле" },
    ],
  },
];

export function getHousingTypeLabel(type: HousingType): string {
  return HOUSING_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function getListingSubtypesForType(type: HousingType): HousingSubtype[] {
  return HOUSING_TYPES.find((t) => t.value === type)?.subtypes ?? [];
}

export function getListingSubtypeLabel(
  type: HousingType,
  subtype: string
): string {
  return (
    getListingSubtypesForType(type).find((s) => s.value === subtype)?.label ??
    subtype
  );
}

export type ListingStatus = "active" | "pending" | "rejected";

export interface ListingRoom {
  id?: string;
  name?: string;
  capacity: number;
  price: number;
}

export type ListingChannelType =
  "realtycalendar" | "travelline" | "bnovo" | "agast";

export interface ListingChannelCredential {
  key: string;
  value: string;
}

export interface ListingChannelConnection {
  id: string;
  type: ListingChannelType;
  credentials: ListingChannelCredential[];
  connectedAt: string;
}

export interface ListingRecord {
  id: string;
  listingNumber?: string;
  title: string;
  description: string;
  images: string[];
  housingType: HousingType;
  subtype: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price: number;
  guests: number;
  status: ListingStatus;
  partnerEmail?: string;
  rooms?: ListingRoom[];
  meals?: string[];
  channelConnections?: ListingChannelConnection[];
  createdAt: string;
  updatedAt: string;
}

export const LISTING_UNIT_OBJECT = "__object__";

export type ListingDateStatus = "available" | "booked" | "closed";

export interface ListingCalendarRecord {
  listingId: string;
  unitId: string;
  dates: Record<string, ListingDateStatus>;
  prices?: Record<string, number>;
  minNights?: number;
  updatedAt: string;
}

export type ListingBookingStatus = "confirmed";

export interface ListingBookingRecord {
  id: string;
  listingId: string;
  listingNumber?: string;
  listingTitle: string;
  unitId: string;
  clientEmail: string;
  clientName: string;
  clientPhone: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  price: number;
  status: ListingBookingStatus;
  createdAt: string;
}

/**
 * Состояние синхронизации подключения к менеджеру каналов (например, Bnovo).
 * Хранит маппинг единиц объявления на канальные сущности, кэш токена и
 * статус последней синхронизации, чтобы избегать двойных броней и потери данных.
 */
export interface ListingChannelSyncRecord {
  connectionId: string;
  listingId: string;
  channelType: ListingChannelType;
  /** Маппинг unitId нашего объявления -> id комнаты/типа комнаты канала. */
  mapping?: Record<string, string>;
  /** id объекта недвижимости в канале (property/hotel). */
  propertyId?: string;
  /** id тарифа/плана цен в канале. */
  planId?: string;
  /** Маппинг id нашей брони -> id брони в канале (для исключения двойных). */
  bookingMappings?: Record<string, string>;
  token?: string;
  tokenExpiresAt?: string;
  webhookRegistered?: boolean;
  /** Идентификатор подписчика вебхука в канале. */
  webhookId?: string;
  lastSyncAt?: string;
  lastError?: string;
  updatedAt: string;
}
