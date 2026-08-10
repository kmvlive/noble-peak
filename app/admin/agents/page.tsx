import { AdminAgentsManager } from "@/components/admin-agents-manager";

export default function AdminAgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Агенты</h1>
        <p className="text-sm text-muted-foreground">
          Управление агентами и настройка лесенки комиссии 3% → 4% → 5%
        </p>
      </div>
      <AdminAgentsManager />
    </div>
  );
}
