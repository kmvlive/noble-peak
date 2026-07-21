import { Service } from "./models";
import type {
  ActivityRecord,
  SectionRecord,
  ActivityCalendarRecord,
  BookingRecord,
  EmailSettingsRecord,
  PaymentSettingsRecord,
  AdminRecord,
  ClientRecord,
  PartnerRecord,
  PasswordResetRecord,
  MenuItemRecord,
  AnalyticsCounterRecord,
  OrderRecord,
} from "./models";
import {
  activities as staticActivities,
  sections as staticSections,
} from "./data";

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
    partnerPrice: a.partnerPrice,
    likes: a.likes,
    isPopular: a.isPopular,
    over18: false,
    orderType: "order_form",
    imageGradient: a.imageGradient,
    location: a.location,
    status: "active" as const,
    partnerEmail: undefined,
    createdAt: new Date("2024-06-01").toISOString(),
    updatedAt: new Date("2024-06-01").toISOString(),
  };
}

export const mockActivities: ActivityRecord[] = staticActivities.map(
  mapStaticActivityToRecord
);

export const mockSections: SectionRecord[] = staticSections.map((s) => ({
  id: s.slug,
  name: s.name,
  description: s.description,
  icon: s.icon,
  imageGradient: s.imageGradient,
  category: s.category,
  createdAt: new Date("2024-06-01").toISOString(),
  updatedAt: new Date("2024-06-01").toISOString(),
}));

function generateMockDates(): Record<
  string,
  { available: boolean; hours?: string[] }
> {
  const result: Record<string, { available: boolean; hours?: string[] }> = {};
  const today = new Date();
  for (let i = 1; i <= 30; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const available = i % 3 !== 0;
    result[dateStr] = {
      available,
      ...(available && i % 2 === 0
        ? { hours: ["10:00", "12:00", "14:00", "16:00", "18:00"] }
        : {}),
    };
  }
  return result;
}

export const mockCalendars: ActivityCalendarRecord[] = staticActivities.map(
  (a) => ({
    activityId: a.id,
    dates: generateMockDates(),
    updatedAt: new Date().toISOString(),
  })
);

export const mockBookings: BookingRecord[] = [
  {
    id: "mock-booking-1",
    clientEmail: "test@example.com",
    clientName: "Тест Пользователь",
    clientPhone: "+7 (999) 123-45-67",
    activityId: "gastronomic-tour",
    activityTitle: "Гастрономический тур",
    date: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
    time: "12:00",
    details: "",
    price: 3500,
    status: "confirmed",
    paymentId: null,
    paymentUrl: null,
    paymentStatus: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-booking-2",
    clientEmail: "test@example.com",
    clientName: "Тест Пользователь",
    clientPhone: "+7 (999) 123-45-67",
    activityId: "extreme-rafting",
    activityTitle: "Рафтинг по горной реке",
    date: new Date(Date.now() + 86400000 * 14).toISOString().split("T")[0],
    time: null,
    details: "Хочу увидеть пороги!",
    price: 5000,
    status: "pending_payment",
    paymentId: "mock-payment-id",
    paymentUrl: null,
    paymentStatus: "NEW",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-booking-3",
    clientEmail: "test@example.com",
    clientName: "Тест Пользователь",
    clientPhone: "+7 (999) 123-45-67",
    activityId: "extreme-rafting",
    activityTitle: "Рафтинг по горной реке",
    date: new Date(Date.now() - 86400000 * 30).toISOString().split("T")[0],
    time: "14:00",
    details: "Отменили по погодным условиям",
    price: 5000,
    status: "cancelled",
    paymentId: null,
    paymentUrl: null,
    paymentStatus: null,
    createdAt: new Date(Date.now() - 86400000 * 35).toISOString(),
  },
];

export const mockEmailSettings: EmailSettingsRecord = {
  id: "default",
  emails: ["artkmv1@ya.ru"],
  defaultEmail: "artkmv1@ya.ru",
  updatedAt: new Date().toISOString(),
};

export const mockPaymentSettings: PaymentSettingsRecord = {
  id: "default",
  terminalKey: "",
  password: "",
  webhookUrl: "",
  updatedAt: new Date().toISOString(),
};

export const mockAdmins: AdminRecord[] = [
  {
    email: "artkmv1@ya.ru",
    password: "Artkmv11",
    name: "Главный администратор",
    role: "main_admin",
    createdAt: new Date("2024-01-01").toISOString(),
    updatedAt: new Date("2024-01-01").toISOString(),
  },
];

export const mockClients: ClientRecord[] = [
  {
    email: "ivan@example.com",
    name: "Иван Петров",
    phone: "+7 (999) 111-22-33",
    passwordHash: "hash123",
    createdAt: new Date("2024-03-01").toISOString(),
  },
  {
    email: "elena@example.com",
    name: "Елена Смирнова",
    phone: "+7 (999) 444-55-66",
    passwordHash: "hash456",
    createdAt: new Date("2024-04-15").toISOString(),
  },
  {
    email: "alexey@example.com",
    name: "Алексей Кузнецов",
    phone: "+7 (999) 777-88-99",
    passwordHash: "hash789",
    createdAt: new Date("2024-05-20").toISOString(),
  },
];

export const mockPartners: PartnerRecord[] = [
  {
    email: "partner@example.com",
    name: "Партнёр Иванов",
    phone: "+7 (999) 000-11-22",
    passwordHash: "hash:partner",
    createdAt: new Date("2024-06-01").toISOString(),
  },
];

export const mockPartnerActivities: ActivityRecord[] = [
  {
    id: "morskoe-puteshestvie",
    title: "Морское путешествие",
    shortDescription: "Увлекательная прогулка на яхте вдоль побережья",
    description: "<p>Приглашаем вас в незабываемое морское путешествие!</p>",
    images: [],
    section: "vodnye",
    price: 5000,
    likes: 0,
    isPopular: false,
    over18: false,
    orderType: "order_form",
    imageGradient: "from-blue-400 to-cyan-500",
    location: "г. Севастополь",
    status: "active",
    partnerEmail: "partner@example.com",
    createdAt: new Date("2024-07-01").toISOString(),
    updatedAt: new Date("2024-07-03").toISOString(),
  },
  {
    id: "gornyj-trekking-aj-petri",
    title: "Горный треккинг на Ай-Петри",
    shortDescription: "Восхождение на одну из красивейших гор Крыма",
    description: "<p>Покорите вершину Ай-Петри!</p>",
    images: [],
    section: "trekking",
    price: 3500,
    likes: 0,
    isPopular: false,
    over18: false,
    orderType: "order_form",
    imageGradient: "from-emerald-400 to-cyan-500",
    location: "г. Ялта",
    status: "active",
    partnerEmail: "partner@example.com",
    createdAt: new Date("2024-07-02").toISOString(),
    updatedAt: new Date("2024-07-04").toISOString(),
  },
  {
    id: "degustacia-vin",
    title: "Дегустация крымских вин",
    shortDescription: "Знакомство с лучшими винодельнями полуострова",
    description: "<p>Откройте для себя мир крымского виноделия!</p>",
    images: [],
    section: "gastronomiya",
    price: 2500,
    likes: 2,
    isPopular: false,
    over18: true,
    orderType: "order_form",
    imageGradient: "from-rose-400 to-purple-500",
    location: "г. Балаклава",
    status: "pending",
    partnerEmail: "partner@example.com",
    createdAt: new Date("2024-08-01").toISOString(),
    updatedAt: new Date("2024-08-01").toISOString(),
  },
  {
    id: "kvest-po-staromu-gorodu",
    title: "Квест по старому городу",
    shortDescription: "Интерактивная прогулка с загадками и историей",
    description: "<p>Узнайте город с новой стороны!</p>",
    images: [],
    section: "razvlecheniya",
    price: 1500,
    likes: 0,
    isPopular: false,
    over18: false,
    orderType: "order_form",
    imageGradient: "from-amber-400 to-orange-500",
    location: "г. Симферополь",
    status: "rejected",
    partnerEmail: "partner@example.com",
    createdAt: new Date("2024-07-15").toISOString(),
    updatedAt: new Date("2024-07-20").toISOString(),
  },
];

export const mockPartnerBookings: BookingRecord[] = [
  {
    id: "mock-partner-booking-1",
    clientEmail: "ivan@example.com",
    clientName: "Иван Петров",
    clientPhone: "+7 (999) 111-22-33",
    activityId: "morskoe-puteshestvie",
    activityTitle: "Морское путешествие",
    date: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
    time: "10:00",
    details: "Жду с нетерпением!",
    price: 5000,
    status: "confirmed",
    paymentId: null,
    paymentUrl: null,
    paymentStatus: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-partner-booking-2",
    clientEmail: "elena@example.com",
    clientName: "Елена Смирнова",
    clientPhone: "+7 (999) 444-55-66",
    activityId: "morskoe-puteshestvie",
    activityTitle: "Морское путешествие",
    date: new Date(Date.now() + 86400000 * 12).toISOString().split("T")[0],
    time: null,
    details: "Хочу взять с собой ребёнка, возможно ли это?",
    price: 5000,
    status: "confirmed",
    paymentId: null,
    paymentUrl: null,
    paymentStatus: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-partner-booking-3",
    clientEmail: "alexey@example.com",
    clientName: "Алексей Кузнецов",
    clientPhone: "+7 (999) 777-88-99",
    activityId: "gornyj-trekking-aj-petri",
    activityTitle: "Горный треккинг на Ай-Петри",
    date: new Date(Date.now() + 86400000 * 8).toISOString().split("T")[0],
    time: "08:00",
    details: "",
    price: 3500,
    status: "pending_payment",
    paymentId: "mock-payment-3",
    paymentUrl: null,
    paymentStatus: "NEW",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-partner-booking-4",
    clientEmail: "ivan@example.com",
    clientName: "Иван Петров",
    clientPhone: "+7 (999) 111-22-33",
    activityId: "gornyj-trekking-aj-petri",
    activityTitle: "Горный треккинг на Ай-Петри",
    date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    time: null,
    details: "Возьму с собой снаряжение",
    price: 3500,
    status: "confirmed",
    paymentId: null,
    paymentUrl: null,
    paymentStatus: null,
    createdAt: new Date().toISOString(),
  },
];

export const mockPendingActivities: ActivityRecord[] = [
  {
    id: "degustacia-vin",
    title: "Дегустация крымских вин",
    shortDescription: "Знакомство с лучшими винодельнями полуострова",
    description: "<p>Откройте для себя мир крымского виноделия!</p>",
    images: [],
    section: "gastronomiya",
    price: 2500,
    likes: 2,
    isPopular: false,
    over18: true,
    orderType: "order_form",
    imageGradient: "from-rose-400 to-purple-500",
    location: "г. Балаклава",
    status: "pending",
    partnerEmail: "partner@example.com",
    createdAt: new Date("2024-08-01").toISOString(),
    updatedAt: new Date("2024-08-01").toISOString(),
  },
];

export const mockPasswordResets: PasswordResetRecord[] = [];

export const mockMenuItems: MenuItemRecord[] = [
  {
    id: "mock-admin-dashboard",
    menuType: "admin",
    name: "Дашборд",
    url: "/admin",
    order: 1,
    createdAt: new Date("2024-01-01").toISOString(),
    updatedAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "mock-admin-activities",
    menuType: "admin",
    name: "Активности",
    url: "/admin",
    order: 2,
    createdAt: new Date("2024-01-01").toISOString(),
    updatedAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "mock-client-home",
    menuType: "client",
    name: "Главная",
    url: "/",
    order: 1,
    createdAt: new Date("2024-01-01").toISOString(),
    updatedAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "mock-client-bookings",
    menuType: "client",
    name: "Мои бронирования",
    url: "/client/bookings",
    order: 2,
    createdAt: new Date("2024-01-01").toISOString(),
    updatedAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "mock-partner-dashboard",
    menuType: "partner",
    name: "Дашборд",
    url: "/partner",
    order: 1,
    createdAt: new Date("2024-01-01").toISOString(),
    updatedAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "mock-partner-activities",
    menuType: "partner",
    name: "Мои активности",
    url: "/partner/activities",
    order: 2,
    createdAt: new Date("2024-01-01").toISOString(),
    updatedAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "mock-footer-about",
    menuType: "footer",
    name: "О нас",
    url: "/about",
    order: 1,
    createdAt: new Date("2024-01-01").toISOString(),
    updatedAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "mock-footer-contacts",
    menuType: "footer",
    name: "Контакты",
    url: "/contacts",
    order: 2,
    createdAt: new Date("2024-01-01").toISOString(),
    updatedAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "mock-footer-policy",
    menuType: "footer",
    name: "Политика конфиденциальности",
    url: "/privacy",
    order: 3,
    createdAt: new Date("2024-01-01").toISOString(),
    updatedAt: new Date("2024-01-01").toISOString(),
  },
];

export const mockAnalyticsCounters: AnalyticsCounterRecord[] = [];

export const mockOrders: OrderRecord[] = [
  {
    id: "mock-order-1",
    orderNumber: "000001",
    bookingId: "mock-booking-1",
    clientEmail: "test@example.com",
    clientName: "Тест Пользователь",
    clientPhone: "+7 (999) 123-45-67",
    activityId: "gastronomic-tour",
    activityTitle: "Гастрономический тур",
    partnerEmail: null,
    date: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
    time: "12:00",
    price: 3500,
    status: "confirmed",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "mock-order-2",
    orderNumber: "000002",
    bookingId: "mock-booking-2",
    clientEmail: "test@example.com",
    clientName: "Тест Пользователь",
    clientPhone: "+7 (999) 123-45-67",
    activityId: "extreme-rafting",
    activityTitle: "Рафтинг по горной реке",
    partnerEmail: "partner@example.com",
    date: new Date(Date.now() + 86400000 * 14).toISOString().split("T")[0],
    time: null,
    price: 5000,
    status: "pending_payment",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "mock-order-3",
    orderNumber: "000003",
    bookingId: "mock-partner-booking-1",
    clientEmail: "ivan@example.com",
    clientName: "Иван Петров",
    clientPhone: "+7 (999) 111-22-33",
    activityId: "morskoe-puteshestvie",
    activityTitle: "Морское путешествие",
    partnerEmail: "partner@example.com",
    date: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
    time: "10:00",
    price: 5000,
    status: "confirmed",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "mock-order-4",
    orderNumber: "000004",
    bookingId: "mock-partner-booking-2",
    clientEmail: "elena@example.com",
    clientName: "Елена Смирнова",
    clientPhone: "+7 (999) 444-55-66",
    activityId: "morskoe-puteshestvie",
    activityTitle: "Морское путешествие",
    partnerEmail: "partner@example.com",
    date: new Date(Date.now() + 86400000 * 12).toISOString().split("T")[0],
    time: null,
    price: 5000,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-order-5",
    orderNumber: "000005",
    bookingId: "mock-partner-booking-3",
    clientEmail: "alexey@example.com",
    clientName: "Алексей Кузнецов",
    clientPhone: "+7 (999) 777-88-99",
    activityId: "gornyj-trekking-aj-petri",
    activityTitle: "Горный треккинг на Ай-Петри",
    partnerEmail: "partner@example.com",
    date: new Date(Date.now() + 86400000 * 8).toISOString().split("T")[0],
    time: "08:00",
    price: 3500,
    status: "pending_payment",
    createdAt: new Date().toISOString(),
  },
];
