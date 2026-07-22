import { Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ClientNotificationsList } from "@/components/client-notifications-list";
import { appName } from "@/lib/app-name";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Уведомления и чат — ${appName}`,
};

export default function ClientNotificationsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Bell className="h-4 w-4" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Уведомления и чат</h1>
      </div>
      <ClientNotificationsList />
      <div className="flex justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>
      </div>
    </div>
  );
}
