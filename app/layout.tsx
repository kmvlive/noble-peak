import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { BridgeProvider } from "@/components/bridge-provider";
import { Toaster } from "@/components/ui/sonner";
import { sections } from "@/lib/data";
import { appName } from "@/lib/app-name";

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
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-14 flex items-center">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold tracking-tight shrink-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              {appName}
            </Link>
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
        <footer className="border-t">
          <div className="container mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {appName}
          </div>
        </footer>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
