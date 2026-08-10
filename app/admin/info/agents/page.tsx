import { AdminInfoManager } from "@/components/admin-info-manager";

export default function AdminInfoAgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Информация агентам
        </h1>
        <p className="text-sm text-muted-foreground">
          Управление информационными страницами для агентов
        </p>
      </div>
      <AdminInfoManager target="agent" />
    </div>
  );
}
