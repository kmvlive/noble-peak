import { AdminMenuManager } from "@/components/admin-menu-manager";

export default function AdminMenuFooterPage() {
  return (
    <AdminMenuManager
      menuType="footer"
      title="Нижнее меню"
      description="Управление пунктами меню в подвале (footer) сайта"
    />
  );
}
