import { Plug } from "lucide-react";
import { PartnerIntegrations } from "@/components/partner-integrations";

export default function PartnerIntegrationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Plug className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Интеграции</h1>
          <p className="text-sm text-muted-foreground">
            Менеджеры каналов для синхронизации календаря сдачи
          </p>
        </div>
      </div>
      <PartnerIntegrations />
    </div>
  );
}
