"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { HelpCircle, LogOut, Sparkles } from "lucide-react";
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
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!hasToken() && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace("/partner/login");
    }
  }, [router]);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const res = await fetch("/api/menu?type=partner");
      const data = await res.json();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch {
      console.error("Ошибка загрузки пунктов меню");
    } finally {
      setMenuLoading(false);
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center border-b px-3 md:px-4 gap-2 md:gap-3">
        <Link
          href="/partner"
          className="flex items-center gap-2 text-sm md:text-base font-semibold tracking-tight shrink-0"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="hidden sm:inline">Кабинет партнёра</span>
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto">
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
                  item.url === "/partner"
                    ? pathname === "/partner"
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
        </div>
        <Link
          href="https://magazin-tour.ru/kak-rabotat-s-magazinom-turov/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden lg:inline">
            Как работать с Магазином туров?
          </span>
        </Link>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 md:mr-1.5" />
          <span className="hidden md:inline">Выйти</span>
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      <FooterMenu />
    </div>
  );
}
