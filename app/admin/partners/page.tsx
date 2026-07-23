import { AdminPartnersManager } from "@/components/admin-partners-manager";

export default function AdminPartnersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Партнёры</h1>
        <p className="text-sm text-muted-foreground">
          Управление партнёрами и индивидуальными разрешениями формы заказа
        </p>
      </div>
      <AdminPartnersManager />
    </div>
  );
}
