"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Wallet,
  FileText,
  Wrench,
  Bell,
  Users,
  CreditCard,
  LogOut,
  UserCircle,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const TOKEN_KEY = "agent_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function hasToken(): boolean {
  return !!getToken();
}

export function clearAgentToken() {
  localStorage.removeItem(TOKEN_KEY);
}

const MENU_ITEMS = [
  { id: "dashboard", name: "Дашборд", url: "/agent", icon: LayoutDashboard },
  {
    id: "earnings",
    name: "Заработок и выплаты",
    url: "/agent/earnings",
    icon: Wallet,
  },
  { id: "reports", name: "Отчёты", url: "/agent/reports", icon: FileText },
  { id: "tools", name: "Инструменты", url: "/agent/tools", icon: Wrench },
  {
    id: "notifications",
    name: "Уведомления",
    url: "/agent/notifications",
    icon: Bell,
  },
  { id: "partners", name: "Партнёры", url: "/agent/partners", icon: Users },
  {
    id: "details",
    name: "Реквизиты агента",
    url: "/agent/details",
    icon: CreditCard,
  },
];

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-1">
      {MENU_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.url === "/agent"
            ? pathname === "/agent"
            : pathname.startsWith(item.url);
        return (
          <Link
            key={item.id}
            href={item.url}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

export function AgentLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!hasToken() && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace("/agent/login");
    }
  }, [router]);

  const isAuthed = hasToken();

  const handleLogout = () => {
    clearAgentToken();
    router.replace("/");
  };

  const isLoginPage = pathname === "/agent/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuthed) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-background">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-card/40">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <UserCircle className="h-5 w-5" />
          </div>
          <span className="text-sm md:text-base font-semibold tracking-tight">
            Кабинет агента
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarContent pathname={pathname} />
        </div>
        <div className="border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            Выйти
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 md:px-4">
          <Sheet>
            <SheetTrigger
              className="md:hidden flex items-center justify-center size-9 rounded-md hover:bg-accent transition-colors"
              aria-label="Меню"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Кабинет агента</SheetTitle>
              </SheetHeader>
              <div className="p-2">
                <SidebarContent pathname={pathname} />
                <hr className="my-2 border-t" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  Выйти
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="md:hidden flex items-center gap-2 text-sm font-semibold tracking-tight">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <UserCircle className="h-4 w-4" />
            </div>
            Кабинет агента
          </div>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="md:hidden"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
