import { AdminPayoutsManager } from "@/components/admin-payouts-manager";

export default function AdminPayoutsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Выплаты агентам</h1>
        <p className="text-sm text-muted-foreground">
          Заявки на выплаты от агентов: подтверждение, отказ и архив
        </p>
      </div>
      <AdminPayoutsManager />
    </div>
  );
}
