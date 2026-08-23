import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import type { SectionRecord } from "@/lib/models";
import { appName } from "@/lib/app-name";
import {
  BridgeProvider,
  AnalyticsInjector,
  NotificationPoller,
  HeaderAuth,
  HeaderCity,
  HeaderSectionSwitch,
  FooterMenu,
  InstallPrompt,
  Toaster,
} from "@/components/root-client-components";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: appName,
  description: appName,
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": appName,
    "format-detection": "telephone=no",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let sections: SectionRecord[] = [];
  try {
    const baseUrl = process.env.BASE_URL || "http://localhost:8080";
    const res = await fetch(`${baseUrl}/api/sections`, {
      next: { revalidate: 60, tags: ["sections"] },
    });
    sections = await res.json();
  } catch {
    sections = [];
  }

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
            <HeaderSectionSwitch />
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <HeaderCity />
              <HeaderAuth />
            </div>
          </div>
          <nav className="container mx-auto flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-none">
            {sections.map((section) => (
              <Link
                key={section.id}
                href={`/sections/${section.id}`}
                className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground min-h-8 flex items-center"
              >
                {section.name}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <FooterMenu />
        <InstallPrompt />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
