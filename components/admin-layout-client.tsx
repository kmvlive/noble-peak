"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, List, LogOut, Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOKEN_KEY = "admin_token";

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

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(hasToken);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!isAuthed && pathname !== "/admin/login" && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace("/admin/login");
    }
  }, [isAuthed, pathname, router]);

  const handleLogout = () => {
    clearToken();
    setIsAuthed(false);
    router.replace("/admin/login");
  };

  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuthed) return null;

  const navItems = [
    { href: "/admin", label: "Дашборд", icon: LayoutDashboard },
    { href: "/admin", label: "Активности", icon: List },
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
          href="/admin"
          className="flex items-center gap-2 text-base font-semibold tracking-tight"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          Админ-панель
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
