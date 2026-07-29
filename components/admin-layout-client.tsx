"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  List,
  LogOut,
  Menu,
  X,
  Sparkles,
  FolderOpen,
  Settings,
  CreditCard,
  Shield,
  Users,
  Clock,
  Navigation,
  ArrowDownFromLine,
  BarChart3,
  FileText,
  MessageSquare,
  Image,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FooterMenu } from "@/components/footer-menu";

interface MenuItem {
  id: string;
  menuType: "admin" | "client" | "partner";
  name: string;
  url: string;
  order: number;
}

const TOKEN_KEY = "admin_token";
const TOKEN_PREFIX = "magazin_tour_admin_v1:";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = "admin_token=; path=/; max-age=0";
}

export { getToken };

function hasToken(): boolean {
  return !!getToken();
}

function getTokenPayload(): {
  email: string;
  role: "main_admin" | "admin";
  ts: number;
} | null {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = atob(token);
    if (!decoded.startsWith(TOKEN_PREFIX)) return null;
    return JSON.parse(decoded.slice(TOKEN_PREFIX.length));
  } catch {
    return null;
  }
}

function isMainAdmin(): boolean {
  const payload = getTokenPayload();
  return payload?.role === "main_admin";
}

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const authed = hasToken();
    setIsAuthed(authed);

    if (pathname !== "/admin/login" && !authed && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace("/admin/login");
    }
  }, [router, pathname]);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const res = await fetch("/api/menu?type=admin");
      const data = await res.json();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch {
      console.error("Ошибка загрузки пунктов меню");
    } finally {
      setMenuLoading(false);
    }
  };

  const handleLogout = useCallback(() => {
    clearToken();
    router.replace("/admin/login");
  }, [router]);

  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthed) return null;

  const isMain = isMainAdmin();

  const allNavItems = [
    { href: "/admin", label: "Дашборд", icon: LayoutDashboard },
    { href: "/admin/activities", label: "Активности", icon: List },
    {
      href: "/admin/activities/pending",
      label: "Новые активности",
      icon: Clock,
    },
    { href: "/admin/reviews", label: "Отзывы", icon: MessageSquare },
    { href: "/admin/sections", label: "Разделы", icon: FolderOpen },
    { href: "/admin/slider", label: "Слайдер", icon: Image },
    { href: "/admin/menu/admin", label: "Меню админов", icon: Navigation },
    {
      href: "/admin/menu/client",
      label: "Меню клиентов",
      icon: Navigation,
    },
    {
      href: "/admin/menu/partner",
      label: "Меню партнёров",
      icon: Navigation,
    },
    {
      href: "/admin/menu/footer",
      label: "Нижнее меню",
      icon: ArrowDownFromLine,
    },
    { href: "/admin/clients", label: "Клиенты", icon: Users },
    { href: "/admin/partners", label: "Партнёры", icon: Users },
    { href: "/admin/orders", label: "Отчёты", icon: FileText },
    { href: "/admin/admins", label: "Администраторы", icon: Shield },
    {
      href: "/admin/payment-settings",
      label: "Платёжная система",
      icon: CreditCard,
    },
    {
      href: "/admin/order-settings",
      label: "Варианты заказа",
      icon: ShoppingCart,
    },
    { href: "/admin/settings", label: "Настройки", icon: Settings },
    { href: "/admin/analytics", label: "Статистика", icon: BarChart3 },
  ];

  const mainOnlyItems = [
    "/admin/slider",
    "/admin/menu/admin",
    "/admin/menu/client",
    "/admin/menu/partner",
    "/admin/menu/footer",
    "/admin/admins",
    "/admin/payment-settings",
    "/admin/order-settings",
    "/admin/settings",
    "/admin/analytics",
  ];

  const navItems = isMain
    ? allNavItems
    : allNavItems.filter((item) => !mainOnlyItems.includes(item.href));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center border-b px-4 gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Закрыть меню" : "Открыть меню"}
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
        <Link
          href="/admin"
          className="flex items-center gap-2 text-base font-semibold tracking-tight"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          Админ-панель
        </Link>
        <div className="flex-1" />
        {menuLoading ? (
          <div className="hidden md:flex items-center gap-1">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-7 w-20" />
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1 overflow-x-auto">
            {menuItems
              .sort((a, b) => a.order - b.order)
              .map((item) => {
                const isActive =
                  item.url === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.url);
                return (
                  <Link
                    key={item.id}
                    href={item.url}
                    className={`whitespace-nowrap rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Выйти</span>
        </Button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-14 z-30 bg-black/20 md:hidden animate-in fade-in duration-200"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside
          className={`w-56 shrink-0 border-r bg-background overflow-y-auto transition-transform duration-200 ${
            sidebarOpen
              ? "fixed inset-y-0 left-0 top-14 z-40 block translate-x-0 md:static md:translate-x-0 md:block md:bg-muted/30"
              : "hidden md:block md:bg-muted/30"
          }`}
        >
          <nav className="flex flex-col gap-1 p-3">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 md:py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
      <FooterMenu />
    </div>
  );
}
