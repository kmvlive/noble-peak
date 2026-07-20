"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FooterMenu } from "@/components/footer-menu";

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
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold tracking-tight shrink-0"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          Личный кабинет
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
                  item.url === "/"
                    ? pathname === "/"
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
        <div className="flex-1" />
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      <FooterMenu />
    </div>
  );
}
