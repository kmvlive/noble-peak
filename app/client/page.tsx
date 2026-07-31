import { Home } from "lucide-react";
import { appName } from "@/lib/app-name";
import { ClientDashboard } from "@/components/client-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Личный кабинет — ${appName}`,
};

export default function ClientPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Home className="h-4 w-4" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Личный кабинет</h1>
      </div>
      <ClientDashboard />
    </div>
  );
}
