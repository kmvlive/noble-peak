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
  over18: boolean;
  activityType: ActivityType;
  orderType: OrderType;
  imageGradient: string;
  location?: string;
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
  createdAt: string;
}

export interface CalendarDateEntry {
  available: boolean;
  hours?: string[];
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
  documentNumber?: string;
  legalData?: LegalData;
  vkUserId?: string;
  vkAccessToken?: string;
  vkNotificationsEnabled?: boolean;
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
  status: string;
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
