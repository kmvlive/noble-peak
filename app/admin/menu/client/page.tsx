import { AdminMenuManager } from "@/components/admin-menu-manager";

export default function AdminMenuClientPage() {
  return (
    <AdminMenuManager
      menuType="client"
      title="Меню для клиентов"
      description="Управление пунктами навигационного меню в личном кабинете клиента"
    />
  );
}
