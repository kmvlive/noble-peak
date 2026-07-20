"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, Sparkles, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface MenuItem {
  id: string;
  menuType: "admin" | "client" | "partner";
  name: string;
  url: string;
  order: number;
}

export function ClientLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

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

  if (isNoSidebarPage) {
    return <>{children}</>;
  }

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
          href="/"
          className="flex items-center gap-2 text-base font-semibold tracking-tight"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          Личный кабинет
        </Link>
        <div className="flex-1" />
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
            {menuLoading ? (
              <div className="space-y-1 px-3 py-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
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
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <Navigation className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })
            )}
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
