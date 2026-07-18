import { docClient } from "./db";
import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { TableName, IndexName } from "./schema";
import { randomUUID } from "node:crypto";

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

export interface ActivityRecord {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  images: string[];
  section: string;
  price: number;
  likes: number;
  isPopular: boolean;
  over18: boolean;
  orderType: OrderType;
  imageGradient: string;
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
