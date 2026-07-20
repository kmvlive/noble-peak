import { AdminMenuManager } from "@/components/admin-menu-manager";

export default function AdminMenuAdminPage() {
  return (
    <AdminMenuManager
      menuType="admin"
      title="Меню для админов"
      description="Управление пунктами навигационного меню в админ-панели"
    />
  );
}
