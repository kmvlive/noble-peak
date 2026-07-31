"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Sparkles, Home, CalendarCheck, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface MenuItem {
  id: string;
  menuType: "admin" | "client" | "partner";
  name: string;
  url: string;
  order: number;
}

const BOTTOM_NAV_ITEMS = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/client/bookings", label: "Бронирования", icon: CalendarCheck },
  { href: "/client/notifications", label: "Уведомления", icon: Bell },
] as const;

export function ClientLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("client_token");
    router.replace("/");
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const res = await fetch("/api/menu?type=client");
      const data = await res.json();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch {
      console.error("Ошибка загрузки пунктов меню");
    } finally {
      setMenuLoading(false);
    }
  };

  const noSidebarPages = [
    "/client/login",
    "/client/forgot-password",
    "/client/reset-password",
  ];
  const isNoSidebarPage = noSidebarPages.some((p) => pathname.startsWith(p));
  const hideBottomNav = isNoSidebarPage;

  if (isNoSidebarPage) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center border-b px-4 gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold tracking-tight shrink-0"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="hidden sm:inline">Личный кабинет</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
          {menuLoading ? (
            <>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-7 w-20" />
            </>
          ) : (
            menuItems
              .sort((a, b) => a.order - b.order)
              .map((item) => {
                const isActive =
                  item.url === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.url);
                return (
                  <Link
                    key={item.id}
                    href={item.url}
                    className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
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
        </nav>
        <div className="hidden md:block flex-1" />
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 md:mr-1.5" />
          <span className="hidden md:inline">Выйти</span>
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
      {!hideBottomNav && (
        <nav className="md:hidden flex h-16 shrink-0 items-center border-t bg-background px-2">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-md py-1.5 min-h-12 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
