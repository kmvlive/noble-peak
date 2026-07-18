import { Service } from "./models";
import type { ActivityRecord } from "./models";
import { activities as staticActivities } from "./data";

export const mockServices: Service[] = [
  {
    id: "mock-service-1",
    name: "API Gateway",
    description: "Шлюз для микросервисной архитектуры",
    status: "active",
    url: "https://api.example.com",
    createdAt: new Date("2024-01-15").toISOString(),
    updatedAt: new Date("2024-01-15").toISOString(),
  },
  {
    id: "mock-service-2",
    name: "Auth Service",
    description: "Сервис аутентификации и авторизации",
    status: "active",
    url: "https://auth.example.com",
    createdAt: new Date("2024-02-01").toISOString(),
    updatedAt: new Date("2024-02-01").toISOString(),
  },
  {
    id: "mock-service-3",
    name: "ML Pipeline",
    description: "Пайплайн для обработки данных с AI",
    status: "deploying",
    url: undefined,
    createdAt: new Date("2024-03-10").toISOString(),
    updatedAt: new Date("2024-03-10").toISOString(),
  },
];

function mapStaticActivityToRecord(
  a: (typeof staticActivities)[number]
): ActivityRecord {
  return {
    id: a.id,
    title: a.title,
    shortDescription: a.shortDescription,
    description: a.description,
    images: a.images,
    section: a.category,
    price: a.price,
    likes: a.likes,
    isPopular: a.isPopular,
    orderType: "order_form",
    imageGradient: a.imageGradient,
    createdAt: new Date("2024-06-01").toISOString(),
    updatedAt: new Date("2024-06-01").toISOString(),
  };
}

export const mockActivities: ActivityRecord[] = staticActivities.map(
  mapStaticActivityToRecord
);
