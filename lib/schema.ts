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
    attributeDefinitions: [{ AttributeName: "email", AttributeType: "S" }],
  },
  [TableName.BOOKINGS]: {
    name: TableName.BOOKINGS,
    keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    attributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "clientEmail", AttributeType: "S" },
    ],
    globalSecondaryIndexes: [
      {
        IndexName: "clientEmail-index",
        KeySchema: [{ AttributeName: "clientEmail", KeyType: "HASH" }],
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
    attributeDefinitions: [{ AttributeName: "email", AttributeType: "S" }],
  },
  [TableName.PASSWORD_RESETS]: {
    name: TableName.PASSWORD_RESETS,
    keySchema: [{ AttributeName: "token", KeyType: "HASH" }],
    attributeDefinitions: [{ AttributeName: "token", AttributeType: "S" }],
  },
};

export const TABLE_NAMES: TableName[] = Object.values(TableName);

export const IndexName = {
  SERVICES_STATUS: "status-index",
  BOOKINGS_CLIENT_EMAIL: "clientEmail-index",
  ACTIVITIES_STATUS: "status-index",
} as const;

export type IndexName = (typeof IndexName)[keyof typeof IndexName];
