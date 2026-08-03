import { AdminInfoManager } from "@/components/admin-info-manager";

export default function AdminInfoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Информация для партнёров
        </h1>
        <p className="text-sm text-muted-foreground">
          Управление информационными страницами для партнёров и туристов
        </p>
      </div>
      <AdminInfoManager />
    </div>
  );
}
