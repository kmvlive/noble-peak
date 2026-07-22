import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { BridgeProvider } from "@/components/bridge-provider";
import { Toaster } from "@/components/ui/sonner";
import { sections } from "@/lib/data";
import { appName } from "@/lib/app-name";
import { FooterMenu } from "@/components/footer-menu";
import { AnalyticsInjector } from "@/components/analytics-injector";
import { NotificationPoller } from "@/components/notification-poller";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: appName,
  description: appName,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={cn("font-sans", geist.variable)}>
      <body className="antialiased min-h-screen bg-background flex flex-col">
        <BridgeProvider />
        <AnalyticsInjector />
        <NotificationPoller />
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-14 flex items-center">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold tracking-tight shrink-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
                <img
                  src="/assets/2026-07-20_11-32-13.png"
                  alt={appName}
                  className="h-5 w-5"
                />
              </div>
              {appName}
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/partner/login"
                className="shrink-0 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Вход для партнёров
              </Link>
              <Link
                href="/client/login"
                className="shrink-0 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Вход для клиентов
              </Link>
            </div>
          </div>
          <nav className="container mx-auto flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-none">
            {sections.map((section) => (
              <Link
                key={section.slug}
                href={`/sections/${section.slug}`}
                className="shrink-0 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {section.name}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <FooterMenu />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
