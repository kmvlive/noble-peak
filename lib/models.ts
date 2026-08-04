import { docClient, isDatabaseAvailable } from "./db";
import { mockInfoPages } from "./mock-data";
import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { TableName, IndexName } from "./schema";
import type { InfoPageRecord, InfoPageTarget } from "./schema";
import { randomUUID } from "node:crypto";
import { sendVkNotification } from "./vk-notify";
import { sendTelegramNotification } from "./telegram-notify";

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

export async function getServiceById(id: string): Promise<Service | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableName.SERVICES,
      Key: { id },
    })
  );
  return (result.Item as Service) ?? null;
}

export async function getServicesByStatus(status: string): Promise<Service[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TableName.SERVICES,
      IndexName: IndexName.SERVICES_STATUS,
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
      },
    })
  );
  return (result.Items as Service[]) ?? [];
}

export async function getAllServices(): Promise<Service[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TableName.SERVICES,
    })
  );
  return (result.Items as Service[]) ?? [];
}

export async function createService(
  data: Omit<Service, "createdAt" | "updatedAt">
): Promise<Service> {
  const now = new Date().toISOString();
  const service: Service = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TableName.SERVICES,
      Item: service,
    })
  );

  return service;
}

export async function updateService(
  id: string,
  data: Partial<Pick<Service, "name" | "description" | "status" | "url">>
): Promise<Service> {
  const updateExpr = [];
  const exprValues: Record<string, unknown> = {};
  const exprNames: Record<string, string> = {};

  if (data.name !== undefined) {
    updateExpr.push("#name = :name");
    exprValues[":name"] = data.name;
    exprNames["#name"] = "name";
  }

  if (data.description !== undefined) {
    updateExpr.push("#description = :description");
    exprValues[":description"] = data.description;
    exprNames["#description"] = "description";
  }

  if (data.status !== undefined) {
    updateExpr.push("#status = :status");
    exprValues[":status"] = data.status;
    exprNames["#status"] = "status";
  }

  if (data.url !== undefined) {
    updateExpr.push("#url = :url");
    exprValues[":url"] = data.url;
    exprNames["#url"] = "url";
  }

  updateExpr.push("updatedAt = :updatedAt");
  exprValues[":updatedAt"] = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TableName.SERVICES,
      Key: { id },
      UpdateExpression: `set ${updateExpr.join(", ")}`,
      ExpressionAttributeValues: exprValues,
      ExpressionAttributeNames:
        Object.keys(exprNames).length > 0 ? exprNames : undefined,
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes as Service;
}

export async function deleteService(id: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.SERVICES,
      Key: { id },
    })
  );
}

export async function getAllActivities(): Promise<ActivityRecord[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TableName.ACTIVITIES,
    })
  );
  return (result.Items as ActivityRecord[]) ?? [];
}

export async function getActivitiesByStatus(
  status: ActivityStatus
): Promise<ActivityRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TableName.ACTIVITIES,
      IndexName: IndexName.ACTIVITIES_STATUS,
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
      },
    })
  );
  return (result.Items as ActivityRecord[]) ?? [];
}

export async function getActivityById(
  id: string
): Promise<ActivityRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableName.ACTIVITIES,
      Key: { id },
    })
  );
  return (result.Item as ActivityRecord) ?? null;
}

export async function createActivity(
  data: Omit<ActivityRecord, "createdAt" | "updatedAt">
): Promise<ActivityRecord> {
  const now = new Date().toISOString();
  const activity: ActivityRecord = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TableName.ACTIVITIES,
      Item: activity,
    })
  );

  return activity;
}

export async function updateActivity(
  id: string,
  data: Partial<Omit<ActivityRecord, "id" | "createdAt" | "updatedAt">>
): Promise<ActivityRecord> {
  const updateExpr: string[] = [];
  const exprValues: Record<string, unknown> = {};
  const exprNames: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    const nameKey = `#${key}`;
    const valKey = `:${key}`;
    updateExpr.push(`${nameKey} = ${valKey}`);
    exprValues[valKey] = value;
    exprNames[nameKey] = key;
  }

  if (updateExpr.length === 0) {
    const existing = await getActivityById(id);
    if (!existing) throw new Error("Activity not found");
    return existing;
  }

  updateExpr.push("updatedAt = :updatedAt");
  exprValues[":updatedAt"] = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TableName.ACTIVITIES,
      Key: { id },
      UpdateExpression: `set ${updateExpr.join(", ")}`,
      ExpressionAttributeValues: exprValues,
      ExpressionAttributeNames: exprNames,
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes as ActivityRecord;
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

export async function getClientByEmail(
  email: string
): Promise<ClientRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableName.CLIENTS,
      Key: { email },
    })
  );
  return (result.Item as ClientRecord) ?? null;
}

export async function getClientByPhone(
  phone: string
): Promise<ClientRecord | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TableName.CLIENTS,
      IndexName: IndexName.CLIENTS_PHONE,
      KeyConditionExpression: "phone = :phone",
      ExpressionAttributeValues: {
        ":phone": phone,
      },
    })
  );
  const items = (result.Items as ClientRecord[]) ?? [];
  return items.length > 0 ? items[0] : null;
}

export async function createClient(
  data: Omit<ClientRecord, "createdAt">
): Promise<ClientRecord> {
  const now = new Date().toISOString();
  const client: ClientRecord = {
    ...data,
    createdAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TableName.CLIENTS,
      Item: client,
      ConditionExpression: "attribute_not_exists(email)",
    })
  );

  return client;
}

export async function getAllClients(): Promise<ClientRecord[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TableName.CLIENTS,
    })
  );
  return (result.Items as ClientRecord[]) ?? [];
}

export async function updateClient(
  email: string,
  data: Partial<
    Pick<
      ClientRecord,
      | "name"
      | "phone"
      | "passwordHash"
      | "vkUserId"
      | "vkAccessToken"
      | "vkNotificationsEnabled"
      | "telegramChatId"
      | "telegramNotificationsEnabled"
    >
  >
): Promise<ClientRecord> {
  const updateExpr: string[] = [];
  const exprValues: Record<string, unknown> = {};
  const exprNames: Record<string, string> = {};

  if (data.name !== undefined) {
    updateExpr.push("#name = :name");
    exprValues[":name"] = data.name;
    exprNames["#name"] = "name";
  }

  if (data.phone !== undefined) {
    updateExpr.push("#phone = :phone");
    exprValues[":phone"] = data.phone;
    exprNames["#phone"] = "phone";
  }

  if (data.passwordHash !== undefined) {
    updateExpr.push("#passwordHash = :passwordHash");
    exprValues[":passwordHash"] = data.passwordHash;
    exprNames["#passwordHash"] = "passwordHash";
  }

  if (data.vkUserId !== undefined) {
    updateExpr.push("#vkUserId = :vkUserId");
    exprValues[":vkUserId"] = data.vkUserId;
    exprNames["#vkUserId"] = "vkUserId";
  }

  if (data.vkAccessToken !== undefined) {
    updateExpr.push("#vkAccessToken = :vkAccessToken");
    exprValues[":vkAccessToken"] = data.vkAccessToken;
    exprNames["#vkAccessToken"] = "vkAccessToken";
  }

  if (data.vkNotificationsEnabled !== undefined) {
    updateExpr.push("#vkNotificationsEnabled = :vkNotificationsEnabled");
    exprValues[":vkNotificationsEnabled"] = data.vkNotificationsEnabled;
    exprNames["#vkNotificationsEnabled"] = "vkNotificationsEnabled";
  }

  if (data.telegramChatId !== undefined) {
    updateExpr.push("#telegramChatId = :telegramChatId");
    exprValues[":telegramChatId"] = data.telegramChatId;
    exprNames["#telegramChatId"] = "telegramChatId";
  }

  if (data.telegramNotificationsEnabled !== undefined) {
    updateExpr.push(
      "#telegramNotificationsEnabled = :telegramNotificationsEnabled"
    );
    exprValues[":telegramNotificationsEnabled"] =
      data.telegramNotificationsEnabled;
    exprNames["#telegramNotificationsEnabled"] = "telegramNotificationsEnabled";
  }

  if (updateExpr.length === 0) {
    const existing = await getClientByEmail(email);
    if (!existing) throw new Error("Client not found");
    return existing;
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TableName.CLIENTS,
      Key: { email },
      UpdateExpression: `set ${updateExpr.join(", ")}`,
      ExpressionAttributeValues: exprValues,
      ExpressionAttributeNames: exprNames,
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes as ClientRecord;
}

export async function deleteClient(email: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.CLIENTS,
      Key: { email },
    })
  );
}

export async function deleteActivity(id: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.ACTIVITIES,
      Key: { id },
    })
  );
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

export async function getAllSections(): Promise<SectionRecord[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TableName.SECTIONS,
    })
  );
  return (result.Items as SectionRecord[]) ?? [];
}

export async function createSection(
  data: Omit<SectionRecord, "createdAt" | "updatedAt">
): Promise<SectionRecord> {
  const now = new Date().toISOString();
  const section: SectionRecord = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TableName.SECTIONS,
      Item: section,
    })
  );

  return section;
}

export async function deleteSection(id: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.SECTIONS,
      Key: { id },
    })
  );
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

export async function getActivityCalendar(
  activityId: string
): Promise<ActivityCalendarRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableName.ACTIVITY_CALENDAR,
      Key: { activityId },
    })
  );
  return (result.Item as ActivityCalendarRecord) ?? null;
}

export async function setActivityCalendar(
  activityId: string,
  dates: Record<string, CalendarDateEntry>
): Promise<ActivityCalendarRecord> {
  const now = new Date().toISOString();
  const record: ActivityCalendarRecord = {
    activityId,
    dates,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TableName.ACTIVITY_CALENDAR,
      Item: record,
    })
  );

  return record;
}

export async function removeBookedSlotFromCalendar(
  activityId: string,
  date: string,
  time: string | null
): Promise<void> {
  const calendar = await getActivityCalendar(activityId);
  if (!calendar) return;

  const entry = calendar.dates[date];
  if (!entry || !entry.available) return;

  if (time && entry.hours && entry.hours.includes(time)) {
    const updatedHours = entry.hours.filter((h) => h !== time);
    if (updatedHours.length === 0) {
      delete calendar.dates[date];
    } else {
      calendar.dates[date] = { available: true, hours: updatedHours };
    }
  } else {
    delete calendar.dates[date];
  }

  await setActivityCalendar(activityId, calendar.dates);
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

export async function getBookingsByActivityIds(
  activityIds: string[]
): Promise<BookingRecord[]> {
  if (activityIds.length === 0) return [];
  const result = await docClient.send(
    new ScanCommand({
      TableName: TableName.BOOKINGS,
    })
  );
  const all = (result.Items as BookingRecord[]) ?? [];
  const idSet = new Set(activityIds);
  return all.filter((b) => idSet.has(b.activityId));
}

export async function getActivitiesByPartnerEmail(
  partnerEmail: string
): Promise<ActivityRecord[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TableName.ACTIVITIES,
      FilterExpression: "partnerEmail = :partnerEmail",
      ExpressionAttributeValues: {
        ":partnerEmail": partnerEmail,
      },
    })
  );
  return (result.Items as ActivityRecord[]) ?? [];
}

export async function createBooking(
  data: Omit<
    BookingRecord,
    "id" | "createdAt" | "status" | "paymentId" | "paymentUrl" | "paymentStatus"
  >,
  isPayment: boolean
): Promise<BookingRecord> {
  const now = new Date().toISOString();
  const booking: BookingRecord = {
    ...data,
    id: randomUUID(),
    status: isPayment ? "pending_payment" : "confirmed",
    paymentId: null,
    paymentUrl: null,
    paymentStatus: null,
    createdAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TableName.BOOKINGS,
      Item: booking,
    })
  );

  return booking;
}

export async function getBookingById(
  id: string
): Promise<BookingRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableName.BOOKINGS,
      Key: { id },
    })
  );
  return (result.Item as BookingRecord) ?? null;
}

export async function getClientBookings(
  clientEmail: string
): Promise<BookingRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TableName.BOOKINGS,
      IndexName: IndexName.BOOKINGS_CLIENT_EMAIL,
      KeyConditionExpression: "clientEmail = :clientEmail",
      ExpressionAttributeValues: {
        ":clientEmail": clientEmail,
      },
    })
  );
  return (result.Items as BookingRecord[]) ?? [];
}

export async function updateBookingPayment(
  id: string,
  data: {
    paymentId: string;
    paymentUrl: string;
  }
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TableName.BOOKINGS,
      Key: { id },
      UpdateExpression: "set paymentId = :paymentId, paymentUrl = :paymentUrl",
      ExpressionAttributeValues: {
        ":paymentId": data.paymentId,
        ":paymentUrl": data.paymentUrl,
      },
    })
  );
}

export async function confirmBookingPayment(
  id: string,
  paymentStatus: string
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TableName.BOOKINGS,
      Key: { id },
      UpdateExpression: "set #status = :status, paymentStatus = :paymentStatus",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": "confirmed",
        ":paymentStatus": paymentStatus,
      },
    })
  );
}

export async function failBookingPayment(
  id: string,
  paymentStatus: string
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TableName.BOOKINGS,
      Key: { id },
      UpdateExpression: "set #status = :status, paymentStatus = :paymentStatus",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": "cancelled",
        ":paymentStatus": paymentStatus,
      },
    })
  );
}

export interface EmailSettingsRecord {
  id: string;
  emails: string[];
  defaultEmail: string;
  updatedAt: string;
}

export async function getEmailSettings(): Promise<EmailSettingsRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableName.EMAIL_SETTINGS,
      Key: { id: "default" },
    })
  );
  return (result.Item as EmailSettingsRecord) ?? null;
}

export async function saveEmailSettings(
  data: Omit<EmailSettingsRecord, "id" | "updatedAt">
): Promise<EmailSettingsRecord> {
  const now = new Date().toISOString();
  const record: EmailSettingsRecord = {
    id: "default",
    ...data,
    updatedAt: now,
  };
  await docClient.send(
    new PutCommand({
      TableName: TableName.EMAIL_SETTINGS,
      Item: record,
    })
  );
  return record;
}

export interface PaymentSettingsRecord {
  id: string;
  terminalKey: string;
  password: string;
  webhookUrl: string;
  updatedAt: string;
}

export async function getPaymentSettings(): Promise<PaymentSettingsRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableName.PAYMENT_SETTINGS,
      Key: { id: "default" },
    })
  );
  return (result.Item as PaymentSettingsRecord) ?? null;
}

export async function savePaymentSettings(
  data: Omit<PaymentSettingsRecord, "id" | "updatedAt">
): Promise<PaymentSettingsRecord> {
  const now = new Date().toISOString();
  const record: PaymentSettingsRecord = {
    id: "default",
    ...data,
    updatedAt: now,
  };
  await docClient.send(
    new PutCommand({
      TableName: TableName.PAYMENT_SETTINGS,
      Item: record,
    })
  );
  return record;
}

export interface AdminRecord {
  email: string;
  password: string;
  name: string;
  role: "main_admin" | "admin";
  createdAt: string;
  updatedAt: string;
}

export async function getAllAdmins(): Promise<AdminRecord[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TableName.ADMINS,
    })
  );
  return (result.Items as AdminRecord[]) ?? [];
}

export async function getAdminByEmail(
  email: string
): Promise<AdminRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableName.ADMINS,
      Key: { email },
    })
  );
  return (result.Item as AdminRecord) ?? null;
}

export async function createAdmin(
  data: Omit<AdminRecord, "createdAt" | "updatedAt">
): Promise<AdminRecord> {
  const now = new Date().toISOString();
  const admin: AdminRecord = {
    ...data,
    email: data.email.toLowerCase(),
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TableName.ADMINS,
      Item: admin,
      ConditionExpression: "attribute_not_exists(email)",
    })
  );

  return admin;
}

export async function updateAdmin(
  email: string,
  data: Partial<Pick<AdminRecord, "password" | "name" | "role">>
): Promise<AdminRecord> {
  const updateExpr: string[] = [];
  const exprValues: Record<string, unknown> = {};
  const exprNames: Record<string, string> = {};

  if (data.password !== undefined) {
    updateExpr.push("#password = :password");
    exprValues[":password"] = data.password;
    exprNames["#password"] = "password";
  }

  if (data.name !== undefined) {
    updateExpr.push("#name = :name");
    exprValues[":name"] = data.name;
    exprNames["#name"] = "name";
  }

  if (data.role !== undefined) {
    updateExpr.push("#role = :role");
    exprValues[":role"] = data.role;
    exprNames["#role"] = "role";
  }

  if (updateExpr.length === 0) {
    const existing = await getAdminByEmail(email);
    if (!existing) throw new Error("Admin not found");
    return existing;
  }

  updateExpr.push("updatedAt = :updatedAt");
  exprValues[":updatedAt"] = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TableName.ADMINS,
      Key: { email },
      UpdateExpression: `set ${updateExpr.join(", ")}`,
      ExpressionAttributeValues: exprValues,
      ExpressionAttributeNames: exprNames,
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes as AdminRecord;
}

export async function deleteAdmin(email: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.ADMINS,
      Key: { email },
    })
  );
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
  createdAt: string;
}

export async function getPartnerByEmail(
  email: string
): Promise<PartnerRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableName.PARTNERS,
      Key: { email },
    })
  );
  return (result.Item as PartnerRecord) ?? null;
}

export async function getPartnerBySlug(
  slug: string
): Promise<PartnerRecord | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TableName.PARTNERS,
      IndexName: IndexName.PARTNERS_SLUG,
      KeyConditionExpression: "#slug = :slug",
      ExpressionAttributeNames: { "#slug": "slug" },
      ExpressionAttributeValues: { ":slug": slug },
    })
  );
  const items = result.Items as PartnerRecord[];
  return items.length > 0 ? items[0] : null;
}

export async function isSlugTaken(
  slug: string,
  excludeEmail?: string
): Promise<boolean> {
  const existing = await getPartnerBySlug(slug);
  if (!existing) return false;
  if (excludeEmail && existing.email === excludeEmail) return false;
  return true;
}

export async function createPartner(
  data: Omit<PartnerRecord, "createdAt">
): Promise<PartnerRecord> {
  const now = new Date().toISOString();
  const partner: PartnerRecord = {
    ...data,
    createdAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TableName.PARTNERS,
      Item: partner,
      ConditionExpression: "attribute_not_exists(email)",
    })
  );

  return partner;
}

export async function getAllPartners(): Promise<PartnerRecord[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TableName.PARTNERS,
    })
  );
  return (result.Items as PartnerRecord[]) ?? [];
}

export async function updatePartner(
  email: string,
  data: Partial<
    Pick<
      PartnerRecord,
      | "name"
      | "phone"
      | "photo"
      | "description"
      | "slug"
      | "orderFormEnabled"
      | "blocked"
      | "documentNumber"
      | "legalData"
      | "vkUserId"
      | "vkAccessToken"
      | "vkNotificationsEnabled"
      | "telegramChatId"
      | "telegramNotificationsEnabled"
    >
  >
): Promise<PartnerRecord> {
  const updateExpr: string[] = [];
  const exprValues: Record<string, unknown> = {};
  const exprNames: Record<string, string> = {};

  if (data.name !== undefined) {
    updateExpr.push("#name = :name");
    exprValues[":name"] = data.name;
    exprNames["#name"] = "name";
  }

  if (data.phone !== undefined) {
    updateExpr.push("#phone = :phone");
    exprValues[":phone"] = data.phone;
    exprNames["#phone"] = "phone";
  }

  if (data.photo !== undefined) {
    updateExpr.push("#photo = :photo");
    exprValues[":photo"] = data.photo;
    exprNames["#photo"] = "photo";
  }

  if (data.description !== undefined) {
    updateExpr.push("#description = :description");
    exprValues[":description"] = data.description;
    exprNames["#description"] = "description";
  }

  if (data.slug !== undefined) {
    updateExpr.push("#slug = :slug");
    exprValues[":slug"] = data.slug;
    exprNames["#slug"] = "slug";
  }

  if (data.orderFormEnabled !== undefined) {
    updateExpr.push("#orderFormEnabled = :orderFormEnabled");
    exprValues[":orderFormEnabled"] = data.orderFormEnabled;
    exprNames["#orderFormEnabled"] = "orderFormEnabled";
  }

  if (data.blocked !== undefined) {
    updateExpr.push("#blocked = :blocked");
    exprValues[":blocked"] = data.blocked;
    exprNames["#blocked"] = "blocked";
  }

  if (data.documentNumber !== undefined) {
    updateExpr.push("#documentNumber = :documentNumber");
    exprValues[":documentNumber"] = data.documentNumber;
    exprNames["#documentNumber"] = "documentNumber";
  }

  if (data.legalData !== undefined) {
    updateExpr.push("#legalData = :legalData");
    exprValues[":legalData"] = data.legalData;
    exprNames["#legalData"] = "legalData";
  }

  if (data.vkUserId !== undefined) {
    updateExpr.push("#vkUserId = :vkUserId");
    exprValues[":vkUserId"] = data.vkUserId;
    exprNames["#vkUserId"] = "vkUserId";
  }

  if (data.vkAccessToken !== undefined) {
    updateExpr.push("#vkAccessToken = :vkAccessToken");
    exprValues[":vkAccessToken"] = data.vkAccessToken;
    exprNames["#vkAccessToken"] = "vkAccessToken";
  }

  if (data.vkNotificationsEnabled !== undefined) {
    updateExpr.push("#vkNotificationsEnabled = :vkNotificationsEnabled");
    exprValues[":vkNotificationsEnabled"] = data.vkNotificationsEnabled;
    exprNames["#vkNotificationsEnabled"] = "vkNotificationsEnabled";
  }

  if (data.telegramChatId !== undefined) {
    updateExpr.push("#telegramChatId = :telegramChatId");
    exprValues[":telegramChatId"] = data.telegramChatId;
    exprNames["#telegramChatId"] = "telegramChatId";
  }

  if (data.telegramNotificationsEnabled !== undefined) {
    updateExpr.push(
      "#telegramNotificationsEnabled = :telegramNotificationsEnabled"
    );
    exprValues[":telegramNotificationsEnabled"] =
      data.telegramNotificationsEnabled;
    exprNames["#telegramNotificationsEnabled"] = "telegramNotificationsEnabled";
  }

  if (updateExpr.length === 0) {
    const existing = await getPartnerByEmail(email);
    if (!existing) throw new Error("Partner not found");
    return existing;
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TableName.PARTNERS,
      Key: { email },
      UpdateExpression: `set ${updateExpr.join(", ")}`,
      ExpressionAttributeValues: exprValues,
      ExpressionAttributeNames: exprNames,
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes as PartnerRecord;
}

export async function deletePartner(email: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.PARTNERS,
      Key: { email },
    })
  );
}

export interface PasswordResetRecord {
  token: string;
  email: string;
  role: "admin" | "client" | "partner";
  expiresAt: string;
  used: boolean;
}

export async function createPasswordResetToken(
  email: string,
  role: "admin" | "client" | "partner"
): Promise<string> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const record: PasswordResetRecord = {
    token,
    email,
    role,
    expiresAt,
    used: false,
  };

  await docClient.send(
    new PutCommand({
      TableName: TableName.PASSWORD_RESETS,
      Item: record,
    })
  );

  return token;
}

export async function getPasswordResetToken(
  token: string
): Promise<PasswordResetRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableName.PASSWORD_RESETS,
      Key: { token },
    })
  );
  return (result.Item as PasswordResetRecord) ?? null;
}

export async function markPasswordResetTokenUsed(token: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TableName.PASSWORD_RESETS,
      Key: { token },
      UpdateExpression: "set #used = :used",
      ExpressionAttributeNames: { "#used": "used" },
      ExpressionAttributeValues: { ":used": true },
    })
  );
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

export async function getMenuItems(
  menuType: "admin" | "client" | "partner" | "footer"
): Promise<MenuItemRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TableName.MENU_ITEMS,
      KeyConditionExpression: "menuType = :menuType",
      ExpressionAttributeValues: {
        ":menuType": menuType,
      },
    })
  );
  const items = (result.Items as MenuItemRecord[]) ?? [];
  return items.sort((a, b) => a.order - b.order);
}

export async function getMenuItem(
  menuType: string,
  id: string
): Promise<MenuItemRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableName.MENU_ITEMS,
      Key: { menuType, id },
    })
  );
  return (result.Item as MenuItemRecord) ?? null;
}

export async function createMenuItem(
  data: Omit<MenuItemRecord, "createdAt" | "updatedAt">
): Promise<MenuItemRecord> {
  const now = new Date().toISOString();
  const menuItem: MenuItemRecord = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TableName.MENU_ITEMS,
      Item: menuItem,
    })
  );

  return menuItem;
}

export async function updateMenuItem(
  menuType: string,
  id: string,
  data: Partial<Pick<MenuItemRecord, "name" | "url" | "order">>
): Promise<MenuItemRecord> {
  const updateExpr: string[] = [];
  const exprValues: Record<string, unknown> = {};
  const exprNames: Record<string, string> = {};

  if (data.name !== undefined) {
    updateExpr.push("#name = :name");
    exprValues[":name"] = data.name;
    exprNames["#name"] = "name";
  }

  if (data.url !== undefined) {
    updateExpr.push("#url = :url");
    exprValues[":url"] = data.url;
    exprNames["#url"] = "url";
  }

  if (data.order !== undefined) {
    updateExpr.push("#order = :order");
    exprValues[":order"] = data.order;
    exprNames["#order"] = "order";
  }

  if (updateExpr.length === 0) {
    const existing = await getMenuItem(menuType, id);
    if (!existing) throw new Error("Menu item not found");
    return existing;
  }

  updateExpr.push("updatedAt = :updatedAt");
  exprValues[":updatedAt"] = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TableName.MENU_ITEMS,
      Key: { menuType, id },
      UpdateExpression: `set ${updateExpr.join(", ")}`,
      ExpressionAttributeValues: exprValues,
      ExpressionAttributeNames: exprNames,
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes as MenuItemRecord;
}

export async function renumberMenuItems(
  menuType: "admin" | "client" | "partner" | "footer",
  expected: MenuItemRecord[]
): Promise<MenuItemRecord[]> {
  const items = expected.length > 0 ? expected : await getMenuItems(menuType);
  const writes = items.flatMap((item, index) =>
    item.order === index
      ? []
      : [updateMenuItem(menuType, item.id, { order: index })]
  );
  await Promise.all(writes);
  return items.map((item, index) =>
    item.order === index ? item : { ...item, order: index }
  );
}

export async function moveMenuItem(
  menuType: "admin" | "client" | "partner" | "footer",
  id: string,
  direction: "up" | "down"
): Promise<MenuItemRecord[]> {
  const items = await getMenuItems(menuType);
  const index = items.findIndex((item) => item.id === id);
  if (items.length === 0) throw new Error("Menu item not found");

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return items;

  const reordered = [...items];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(targetIndex, 0, moved);

  return renumberMenuItems(
    menuType,
    reordered.map((item, i) => ({ ...item, order: i }))
  );
}

export async function deleteMenuItem(
  menuType: "admin" | "client" | "partner" | "footer",
  id: string
): Promise<MenuItemRecord[]> {
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.MENU_ITEMS,
      Key: { menuType, id },
    })
  );

  const remaining = await getMenuItems(menuType);
  await renumberMenuItems(
    menuType,
    remaining.map((item, i) => ({ ...item, order: i }))
  );
  return remaining;
}

export interface AnalyticsCounterRecord {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

export async function getAllAnalyticsCounters(): Promise<
  AnalyticsCounterRecord[]
> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TableName.ANALYTICS_COUNTERS,
    })
  );
  return (result.Items as AnalyticsCounterRecord[]) ?? [];
}

export async function createAnalyticsCounter(
  data: Omit<AnalyticsCounterRecord, "id" | "createdAt">
): Promise<AnalyticsCounterRecord> {
  const now = new Date().toISOString();
  const id = randomUUID();
  const record: AnalyticsCounterRecord = {
    id,
    ...data,
    createdAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TableName.ANALYTICS_COUNTERS,
      Item: record,
    })
  );

  return record;
}

export async function deleteAnalyticsCounter(id: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.ANALYTICS_COUNTERS,
      Key: { id },
    })
  );
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

export async function getNextOrderNumber(): Promise<string> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TableName.ORDERS,
      ProjectionExpression: "orderNumber",
    })
  );
  const items = (result.Items as { orderNumber: string }[]) ?? [];
  let max = 0;
  for (const item of items) {
    const num = parseInt(item.orderNumber, 10);
    if (!isNaN(num) && num > max) max = num;
  }
  return String(max + 1).padStart(6, "0");
}

export async function createOrder(
  data: Omit<OrderRecord, "id" | "orderNumber" | "createdAt">
): Promise<OrderRecord> {
  const now = new Date().toISOString();
  const orderNumber = await getNextOrderNumber();
  const order: OrderRecord = {
    ...data,
    id: randomUUID(),
    orderNumber,
    createdAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TableName.ORDERS,
      Item: order,
    })
  );

  return order;
}

export async function getAllOrders(options?: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<{ orders: OrderRecord[]; total: number }> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TableName.ORDERS,
    })
  );
  let items = (result.Items as OrderRecord[]) ?? [];

  if (options?.search) {
    const q = options.search.trim().toLowerCase();
    items = items.filter((o) => o.orderNumber.toLowerCase().includes(q));
  }

  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = items.length;
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;
  const orders = items.slice(offset, offset + limit);

  return { orders, total };
}

export async function getOrderById(id: string): Promise<OrderRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableName.ORDERS,
      Key: { id },
    })
  );
  return (result.Item as OrderRecord) ?? null;
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

export async function createReview(
  data: Omit<ReviewRecord, "id" | "createdAt" | "status">
): Promise<ReviewRecord> {
  const review: ReviewRecord = {
    id: randomUUID(),
    ...data,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TableName.REVIEWS,
      Item: review,
    })
  );

  return review;
}

export async function getApprovedReviewsByActivity(
  activityId: string
): Promise<ReviewRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TableName.REVIEWS,
      KeyConditionExpression: "activityId = :activityId",
      FilterExpression: "#status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":activityId": activityId,
        ":status": "approved",
      },
    })
  );
  return (result.Items as ReviewRecord[]) ?? [];
}

export async function getReviewById(
  activityId: string,
  id: string
): Promise<ReviewRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableName.REVIEWS,
      Key: { activityId, id },
    })
  );
  return (result.Item as ReviewRecord) ?? null;
}

export async function getAllReviews(): Promise<ReviewRecord[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TableName.REVIEWS,
    })
  );
  return (result.Items as ReviewRecord[]) ?? [];
}

export async function getReviewsByStatus(
  status: ReviewStatus
): Promise<ReviewRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TableName.REVIEWS,
      IndexName: IndexName.REVIEWS_STATUS,
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
      },
    })
  );
  return (result.Items as ReviewRecord[]) ?? [];
}

export async function updateReviewStatus(
  activityId: string,
  id: string,
  status: ReviewStatus
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TableName.REVIEWS,
      Key: { activityId, id },
      UpdateExpression: "set #status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
      },
    })
  );
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

export async function createNotification(
  data: Omit<NotificationRecord, "id" | "createdAt" | "isRead">
): Promise<NotificationRecord | null> {
  const notification: NotificationRecord = {
    id: randomUUID(),
    ...data,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: TableName.NOTIFICATIONS,
        Item: notification,
      })
    );
  } catch (e) {
    console.error("Ошибка сохранения уведомления в БД:", e);
  }

  sendVkNotification(data.recipientEmail, data.title, data.message).catch((e) =>
    console.error("VK notify error:", e)
  );

  sendTelegramNotification(data.recipientEmail, data.title, data.message).catch(
    (e) => console.error("Telegram notify error:", e)
  );

  return notification;
}

export async function getNotificationsByRecipient(
  recipientEmail: string
): Promise<NotificationRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TableName.NOTIFICATIONS,
      IndexName: IndexName.NOTIFICATIONS_RECIPIENT_EMAIL,
      KeyConditionExpression: "recipientEmail = :recipientEmail",
      ExpressionAttributeValues: {
        ":recipientEmail": recipientEmail,
      },
      ScanIndexForward: false,
    })
  );
  return (result.Items as NotificationRecord[]) ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TableName.NOTIFICATIONS,
      Key: { id },
      UpdateExpression: "set isRead = :isRead",
      ExpressionAttributeValues: {
        ":isRead": true,
      },
    })
  );
}

export async function markAllNotificationsRead(
  recipientEmail: string
): Promise<void> {
  const notifications = await getNotificationsByRecipient(recipientEmail);
  const unread = notifications.filter((n) => !n.isRead);
  await Promise.all(unread.map((n) => markNotificationRead(n.id)));
}

export async function deleteNotification(id: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.NOTIFICATIONS,
      Key: { id },
    })
  );
}

export interface OrderSettingsRecord {
  id: string;
  orderFormEnabled: boolean;
  updatedAt: string;
}

export async function getOrderSettings(): Promise<OrderSettingsRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableName.ORDER_SETTINGS,
      Key: { id: "default" },
    })
  );
  return (result.Item as OrderSettingsRecord) ?? null;
}

export async function saveOrderSettings(
  data: Omit<OrderSettingsRecord, "id" | "updatedAt">
): Promise<OrderSettingsRecord> {
  const now = new Date().toISOString();
  const record: OrderSettingsRecord = {
    id: "default",
    ...data,
    updatedAt: now,
  };
  await docClient.send(
    new PutCommand({
      TableName: TableName.ORDER_SETTINGS,
      Item: record,
    })
  );
  return record;
}

export interface SliderImage {
  id: string;
  imageUrl: string;
  position?: "center" | "top" | "bottom";
  createdAt: string;
}

export async function getAllSliderImages(): Promise<SliderImage[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TableName.SLIDER_IMAGES,
    })
  );
  return (result.Items as SliderImage[]) ?? [];
}

export async function createSliderImage(
  imageUrl: string
): Promise<SliderImage> {
  const id = randomUUID();
  const record: SliderImage = {
    id,
    imageUrl,
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TableName.SLIDER_IMAGES,
      Item: record,
    })
  );

  return record;
}

export async function deleteSliderImage(id: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.SLIDER_IMAGES,
      Key: { id },
    })
  );
}

export async function updateSliderImagePosition(
  id: string,
  position: "center" | "top" | "bottom"
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TableName.SLIDER_IMAGES,
      Key: { id },
      UpdateExpression: "SET #pos = :pos",
      ExpressionAttributeNames: { "#pos": "position" },
      ExpressionAttributeValues: { ":pos": position },
    })
  );
}

export interface CityRecord {
  name: string;
  createdAt: string;
}

export async function getAllCities(): Promise<CityRecord[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TableName.CITIES,
    })
  );
  return (result.Items as CityRecord[]) ?? [];
}

export async function createCity(name: string): Promise<CityRecord> {
  const city: CityRecord = {
    name,
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TableName.CITIES,
      Item: city,
      ConditionExpression: "attribute_not_exists(#name)",
      ExpressionAttributeNames: { "#name": "name" },
    })
  );

  return city;
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

export async function sendChatMessage(
  data: Omit<ChatMessageRecord, "id" | "createdAt">
): Promise<ChatMessageRecord> {
  const message: ChatMessageRecord = {
    id: randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TableName.CHAT_MESSAGES,
      Item: message,
    })
  );

  return message;
}

export async function getChatMessagesByOrder(
  orderId: string
): Promise<ChatMessageRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TableName.CHAT_MESSAGES,
      IndexName: IndexName.CHAT_MESSAGES_ORDER_ID,
      KeyConditionExpression: "orderId = :orderId",
      ExpressionAttributeValues: {
        ":orderId": orderId,
      },
      ScanIndexForward: true,
    })
  );
  return (result.Items as ChatMessageRecord[]) ?? [];
}

export async function getChatThreadsForClient(
  clientEmail: string
): Promise<ChatMessageRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TableName.CHAT_MESSAGES,
      IndexName: IndexName.CHAT_MESSAGES_CLIENT_EMAIL,
      KeyConditionExpression: "clientEmail = :clientEmail",
      ExpressionAttributeValues: {
        ":clientEmail": clientEmail,
      },
      ScanIndexForward: false,
    })
  );
  return (result.Items as ChatMessageRecord[]) ?? [];
}

export async function getChatThreadsForPartner(
  partnerEmail: string
): Promise<ChatMessageRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TableName.CHAT_MESSAGES,
      IndexName: IndexName.CHAT_MESSAGES_PARTNER_EMAIL,
      KeyConditionExpression: "partnerEmail = :partnerEmail",
      ExpressionAttributeValues: {
        ":partnerEmail": partnerEmail,
      },
      ScanIndexForward: false,
    })
  );
  return (result.Items as ChatMessageRecord[]) ?? [];
}

export async function getInfoPagesByTarget(
  target: InfoPageTarget
): Promise<InfoPageRecord[]> {
  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return mockInfoPages.filter((p) => p.target === target);
  }
  const result = await docClient.send(
    new QueryCommand({
      TableName: TableName.INFO_PAGES,
      IndexName: IndexName.INFO_PAGES_TARGET,
      KeyConditionExpression: "#target = :target",
      ExpressionAttributeNames: { "#target": "target" },
      ExpressionAttributeValues: { ":target": target },
    })
  );
  return (result.Items as InfoPageRecord[]) ?? [];
}

export async function getAllInfoPages(): Promise<InfoPageRecord[]> {
  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return mockInfoPages;
  }
  const result = await docClient.send(
    new ScanCommand({
      TableName: TableName.INFO_PAGES,
    })
  );
  return (result.Items as InfoPageRecord[]) ?? [];
}

export async function getInfoPageById(
  id: string
): Promise<InfoPageRecord | null> {
  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return mockInfoPages.find((p) => p.id === id) ?? null;
  }
  const result = await docClient.send(
    new GetCommand({
      TableName: TableName.INFO_PAGES,
      Key: { id },
    })
  );
  return (result.Item as InfoPageRecord) ?? null;
}

export async function createInfoPage(
  data: Omit<InfoPageRecord, "createdAt" | "updatedAt">
): Promise<InfoPageRecord> {
  const now = new Date().toISOString();
  const page: InfoPageRecord = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  await docClient.send(
    new PutCommand({
      TableName: TableName.INFO_PAGES,
      Item: page,
    })
  );
  return page;
}

export async function updateInfoPage(
  id: string,
  data: Partial<Pick<InfoPageRecord, "title" | "content" | "target">>
): Promise<InfoPageRecord> {
  const updateExpr: string[] = [];
  const exprValues: Record<string, unknown> = {};
  const exprNames: Record<string, string> = {};

  if (data.title !== undefined) {
    updateExpr.push("#title = :title");
    exprValues[":title"] = data.title;
    exprNames["#title"] = "title";
  }
  if (data.content !== undefined) {
    updateExpr.push("#content = :content");
    exprValues[":content"] = data.content;
    exprNames["#content"] = "content";
  }
  if (data.target !== undefined) {
    updateExpr.push("#target = :target");
    exprValues[":target"] = data.target;
    exprNames["#target"] = "target";
  }

  updateExpr.push("updatedAt = :updatedAt");
  exprValues[":updatedAt"] = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TableName.INFO_PAGES,
      Key: { id },
      UpdateExpression: `set ${updateExpr.join(", ")}`,
      ExpressionAttributeValues: exprValues,
      ExpressionAttributeNames: exprNames,
      ReturnValues: "ALL_NEW",
    })
  );
  return result.Attributes as InfoPageRecord;
}

export async function deleteInfoPage(id: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.INFO_PAGES,
      Key: { id },
    })
  );
}
