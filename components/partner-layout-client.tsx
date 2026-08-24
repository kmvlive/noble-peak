"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  List,
  BedDouble,
  ShoppingCart,
  CalendarDays,
  CalendarRange,
  Bell,
  Globe,
  Settings,
  FileText,
  HelpCircle,
  LogOut,
  Menu,
  Plus,
  Plug,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

interface SidebarEntry {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface SidebarSection {
  heading?: string;
  items: SidebarEntry[];
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    items: [{ href: "/partner", label: "Дашборд", icon: LayoutDashboard }],
  },
  {
    heading: "Активности",
    items: [
      { href: "/partner/activities", label: "Мои активности", icon: List },
      { href: "/partner/calendar", label: "Календарь", icon: CalendarDays },
      { href: "/partner/orders", label: "Заказы", icon: ShoppingCart },
    ],
  },
  {
    heading: "Сдача в аренду",
    items: [
      { href: "/partner/listings/new", label: "Добавить объект", icon: Plus },
      { href: "/partner/listings", label: "Мои объявления", icon: BedDouble },
      {
        href: "/partner/listings/calendar",
        label: "Календарь сдачи",
        icon: CalendarRange,
      },
      { href: "/partner/integrations", label: "Интеграции", icon: Plug },
    ],
  },
  {
    items: [
      {
        href: "/partner/notifications",
        label: "Уведомления и чат",
        icon: Bell,
      },
      {
        href: "/partner/profile/public",
        label: "Публичный профиль",
        icon: Globe,
      },
      { href: "/partner/profile", label: "Мой профиль", icon: Settings },
      { href: "/partner/legal", label: "Анкета партнёра", icon: FileText },
    ],
  },
];

function SidebarContent({ pathname }: { pathname: string }) {
  const allEntries = SIDEBAR_SECTIONS.flatMap((s) => s.items);
  const activeHref = allEntries
    .filter((item) =>
      item.href === "/partner"
        ? pathname === "/partner"
        : pathname === item.href || pathname.startsWith(`${item.href}/`)
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="flex flex-col p-3">
      {SIDEBAR_SECTIONS.map((section, index) => (
        <div key={index} className="flex flex-col">
          {index > 0 && <hr className="my-2 border-t border-border/70" />}
          {section.heading && (
            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {section.heading}
            </p>
          )}
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
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
    router.replace("/");
  };

  const isLoginPage = pathname === "/partner/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuthed) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center border-b px-3 md:px-4 gap-2 md:gap-3">
        <Sheet>
          <SheetTrigger
            className="md:hidden flex items-center justify-center size-9 rounded-md hover:bg-accent transition-colors"
            aria-label="Меню"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Меню</SheetTitle>
            </SheetHeader>
            <SidebarContent pathname={pathname} />
            <hr className="my-2 border-t" />
            <Link
              href="https://magazin-tour.ru/kak-rabotat-s-magazinom-turov/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              Как работать с Магазином туров?
            </Link>
          </SheetContent>
        </Sheet>
        <Link
          href="/partner"
          className="flex items-center gap-2 text-sm md:text-base font-semibold tracking-tight shrink-0"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="hidden sm:inline">Кабинет партнёра</span>
        </Link>
        <div className="hidden md:flex items-center gap-1 overflow-x-auto">
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
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:block w-56 shrink-0 border-r bg-background overflow-y-auto md:bg-muted/30">
          <SidebarContent pathname={pathname} />
        </aside>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
      <FooterMenu />
    </div>
  );
}
