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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface MenuItem {
  id: string;
  menuType: "admin" | "client" | "partner";
  name: string;
  url: string;
  order: number;
}

const TOKEN_KEY = "admin_token";
const TOKEN_PREFIX = "magazin_tour_admin_v1:";
const MAIN_ADMIN_EMAIL = "artkmv1@ya.ru";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export { getToken };

function hasToken(): boolean {
  return !!getToken();
}

function getTokenEmail(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = atob(token);
    if (!decoded.startsWith(TOKEN_PREFIX)) return null;
    const payload = JSON.parse(decoded.slice(TOKEN_PREFIX.length));
    return payload.email ?? null;
  } catch {
    return null;
  }
}

function isMainAdmin(): boolean {
  return getTokenEmail() === MAIN_ADMIN_EMAIL;
}

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!hasToken() && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace("/admin/login");
    }
  }, [router]);

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

  const isAuthed = hasToken();

  const handleLogout = useCallback(() => {
    clearToken();
    router.replace("/admin/login");
  }, [router]);

  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuthed) return null;

  const isMain = isMainAdmin();

  const allNavItems = [
    { href: "/admin", label: "Дашборд", icon: LayoutDashboard },
    { href: "/admin", label: "Активности", icon: List },
    {
      href: "/admin/activities/pending",
      label: "Новые активности",
      icon: Clock,
    },
    { href: "/admin/sections", label: "Разделы", icon: FolderOpen },
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
    { href: "/admin/clients", label: "Клиенты", icon: Users },
    { href: "/admin/admins", label: "Администраторы", icon: Shield },
    {
      href: "/admin/payment-settings",
      label: "Платёжная система",
      icon: CreditCard,
    },
    { href: "/admin/settings", label: "Настройки", icon: Settings },
  ];

  const mainOnlyItems = [
    "/admin/admins",
    "/admin/payment-settings",
    "/admin/settings",
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
          menuItems
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
            })
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="mr-1.5 h-4 w-4" />
          Выйти
        </Button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`w-56 shrink-0 border-r bg-muted/30 overflow-y-auto ${
            sidebarOpen
              ? "fixed inset-0 top-14 z-40 block bg-background/95 md:static md:block"
              : "hidden md:block"
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
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
    </div>
  );
}
