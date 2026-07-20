"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  PlusCircle,
  List,
  ShoppingCart,
  Calendar,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TOKEN_KEY = "partner_token";

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

export function PartnerLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!hasToken() && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace("/partner/login");
    }
  }, [router]);

  const isAuthed = hasToken();

  const handleLogout = () => {
    clearToken();
    router.replace("/partner/login");
  };

  const isLoginPage = pathname === "/partner/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuthed) return null;

  const navItems = [
    { href: "/partner", label: "Дашборд", icon: LayoutDashboard },
    {
      href: "/partner/activities/new",
      label: "Добавить активность",
      icon: PlusCircle,
    },
    {
      href: "/partner/activities",
      label: "Мои активности",
      icon: List,
    },
    { href: "/partner/orders", label: "Заказы", icon: ShoppingCart },
    { href: "/partner/calendar", label: "Календарь", icon: Calendar },
    {
      href: "https://magazin-tour.ru/kak-rabotat-s-magazinom-turov/",
      label: "Как работать с Магазином туров?",
      icon: HelpCircle,
    },
  ];

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
          href="/partner"
          className="flex items-center gap-2 text-base font-semibold tracking-tight"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          Кабинет партнёра
        </Link>
        <div className="flex-1" />
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
              const isExternal = item.href.startsWith("http");
              const isActive = isExternal
                ? false
                : item.href === "/partner"
                  ? pathname === "/partner"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  {...(isExternal
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
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
