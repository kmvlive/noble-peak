import {
  type KeySchemaElement,
  type AttributeDefinition,
  type GlobalSecondaryIndex,
} from "@aws-sdk/client-dynamodb";

export const TableName = {
  SERVICES: "services",
  ACTIVITIES: "activities",
  SECTIONS: "sections",
  ACTIVITY_CALENDAR: "activity_calendar",
  CLIENTS: "clients",
  BOOKINGS: "bookings",
  EMAIL_SETTINGS: "email_settings",
  PAYMENT_SETTINGS: "payment_settings",
  ADMINS: "admins",
  PARTNERS: "partners",
  PASSWORD_RESETS: "password_resets",
  MENU_ITEMS: "menu_items",
  ANALYTICS_COUNTERS: "analytics_counters",
  ORDERS: "orders",
  REVIEWS: "reviews",
  NOTIFICATIONS: "notifications",
  CHAT_MESSAGES: "chat_messages",
  SLIDER_IMAGES: "slider_images",
  ORDER_SETTINGS: "order_settings",
  CITIES: "cities",
  INFO_PAGES: "info_pages",
} as const;

export type TableName = (typeof TableName)[keyof typeof TableName];

export interface TableSchema {
  name: TableName;
  keySchema: KeySchemaElement[];
  attributeDefinitions: AttributeDefinition[];
  globalSecondaryIndexes?: GlobalSecondaryIndex[];
}

export const TABLE_SCHEMAS: Record<TableName, TableSchema> = {
  [TableName.SERVICES]: {
    name: TableName.SERVICES,
    keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    attributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
    ],
    globalSecondaryIndexes: [
      {
        IndexName: "status-index",
        KeySchema: [{ AttributeName: "status", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },
  [TableName.ACTIVITIES]: {
    name: TableName.ACTIVITIES,
    keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    attributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
    ],
    globalSecondaryIndexes: [
      {
        IndexName: "status-index",
        KeySchema: [{ AttributeName: "status", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },
  [TableName.SECTIONS]: {
    name: TableName.SECTIONS,
    keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    attributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
  },
  [TableName.ACTIVITY_CALENDAR]: {
    name: TableName.ACTIVITY_CALENDAR,
    keySchema: [{ AttributeName: "activityId", KeyType: "HASH" }],
    attributeDefinitions: [{ AttributeName: "activityId", AttributeType: "S" }],
  },
  [TableName.CLIENTS]: {
    name: TableName.CLIENTS,
    keySchema: [{ AttributeName: "email", KeyType: "HASH" }],
    attributeDefinitions: [
      { AttributeName: "email", AttributeType: "S" },
      { AttributeName: "phone", AttributeType: "S" },
    ],
    globalSecondaryIndexes: [
      {
        IndexName: "phone-index",
        KeySchema: [{ AttributeName: "phone", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },
  [TableName.BOOKINGS]: {
    name: TableName.BOOKINGS,
    keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    attributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "clientEmail", AttributeType: "S" },
      { AttributeName: "activityId", AttributeType: "S" },
    ],
    globalSecondaryIndexes: [
      {
        IndexName: "clientEmail-index",
        KeySchema: [{ AttributeName: "clientEmail", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "activityId-index",
        KeySchema: [{ AttributeName: "activityId", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },
  [TableName.EMAIL_SETTINGS]: {
    name: TableName.EMAIL_SETTINGS,
    keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    attributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
  },
  [TableName.PAYMENT_SETTINGS]: {
    name: TableName.PAYMENT_SETTINGS,
    keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    attributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
  },
  [TableName.ADMINS]: {
    name: TableName.ADMINS,
    keySchema: [{ AttributeName: "email", KeyType: "HASH" }],
    attributeDefinitions: [{ AttributeName: "email", AttributeType: "S" }],
  },
  [TableName.PARTNERS]: {
    name: TableName.PARTNERS,
    keySchema: [{ AttributeName: "email", KeyType: "HASH" }],
    attributeDefinitions: [
      { AttributeName: "email", AttributeType: "S" },
      { AttributeName: "slug", AttributeType: "S" },
    ],
    globalSecondaryIndexes: [
      {
        IndexName: "slug-index",
        KeySchema: [{ AttributeName: "slug", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },
  [TableName.PASSWORD_RESETS]: {
    name: TableName.PASSWORD_RESETS,
    keySchema: [{ AttributeName: "token", KeyType: "HASH" }],
    attributeDefinitions: [{ AttributeName: "token", AttributeType: "S" }],
  },
  [TableName.MENU_ITEMS]: {
    name: TableName.MENU_ITEMS,
    keySchema: [
      { AttributeName: "menuType", KeyType: "HASH" },
      { AttributeName: "id", KeyType: "RANGE" },
    ],
    attributeDefinitions: [
      { AttributeName: "menuType", AttributeType: "S" },
      { AttributeName: "id", AttributeType: "S" },
    ],
  },
  [TableName.ANALYTICS_COUNTERS]: {
    name: TableName.ANALYTICS_COUNTERS,
    keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    attributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
  },
  [TableName.ORDERS]: {
    name: TableName.ORDERS,
    keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    attributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "clientEmail", AttributeType: "S" },
      { AttributeName: "activityId", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
    ],
    globalSecondaryIndexes: [
      {
        IndexName: "clientEmail-index",
        KeySchema: [{ AttributeName: "clientEmail", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "activityId-index",
        KeySchema: [{ AttributeName: "activityId", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "status-index",
        KeySchema: [{ AttributeName: "status", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },
  [TableName.NOTIFICATIONS]: {
    name: TableName.NOTIFICATIONS,
    keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    attributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "recipientEmail", AttributeType: "S" },
    ],
    globalSecondaryIndexes: [
      {
        IndexName: "recipientEmail-index",
        KeySchema: [{ AttributeName: "recipientEmail", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },

  [TableName.CHAT_MESSAGES]: {
    name: TableName.CHAT_MESSAGES,
    keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    attributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "orderId", AttributeType: "S" },
      { AttributeName: "clientEmail", AttributeType: "S" },
      { AttributeName: "partnerEmail", AttributeType: "S" },
    ],
    globalSecondaryIndexes: [
      {
        IndexName: "orderId-index",
        KeySchema: [
          { AttributeName: "orderId", KeyType: "HASH" },
          { AttributeName: "id", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "clientEmail-index",
        KeySchema: [
          { AttributeName: "clientEmail", KeyType: "HASH" },
          { AttributeName: "id", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "partnerEmail-index",
        KeySchema: [
          { AttributeName: "partnerEmail", KeyType: "HASH" },
          { AttributeName: "id", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },

  [TableName.REVIEWS]: {
    name: TableName.REVIEWS,
    keySchema: [
      { AttributeName: "activityId", KeyType: "HASH" },
      { AttributeName: "id", KeyType: "RANGE" },
    ],
    attributeDefinitions: [
      { AttributeName: "activityId", AttributeType: "S" },
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
    ],
    globalSecondaryIndexes: [
      {
        IndexName: "status-index",
        KeySchema: [{ AttributeName: "status", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },

  [TableName.SLIDER_IMAGES]: {
    name: TableName.SLIDER_IMAGES,
    keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    attributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
  },

  [TableName.ORDER_SETTINGS]: {
    name: TableName.ORDER_SETTINGS,
    keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    attributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
  },

  [TableName.CITIES]: {
    name: TableName.CITIES,
    keySchema: [{ AttributeName: "name", KeyType: "HASH" }],
    attributeDefinitions: [{ AttributeName: "name", AttributeType: "S" }],
  },

  [TableName.INFO_PAGES]: {
    name: TableName.INFO_PAGES,
    keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    attributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "target", AttributeType: "S" },
    ],
    globalSecondaryIndexes: [
      {
        IndexName: "target-index",
        KeySchema: [{ AttributeName: "target", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  },
};

export const TABLE_NAMES: TableName[] = Object.values(TableName);

export const IndexName = {
  SERVICES_STATUS: "status-index",
  BOOKINGS_CLIENT_EMAIL: "clientEmail-index",
  BOOKINGS_ACTIVITY_ID: "activityId-index",
  ACTIVITIES_STATUS: "status-index",
  REVIEWS_STATUS: "status-index",
  NOTIFICATIONS_RECIPIENT_EMAIL: "recipientEmail-index",
  CHAT_MESSAGES_ORDER_ID: "orderId-index",
  CHAT_MESSAGES_CLIENT_EMAIL: "clientEmail-index",
  CHAT_MESSAGES_PARTNER_EMAIL: "partnerEmail-index",
  PARTNERS_SLUG: "slug-index",
  CLIENTS_PHONE: "phone-index",
  ORDERS_CLIENT_EMAIL: "clientEmail-index",
  ORDERS_ACTIVITY_ID: "activityId-index",
  ORDERS_STATUS: "status-index",
  ORDER_SETTINGS_ID: "id",
  INFO_PAGES_TARGET: "target-index",
} as const;

export type IndexName = (typeof IndexName)[keyof typeof IndexName];
