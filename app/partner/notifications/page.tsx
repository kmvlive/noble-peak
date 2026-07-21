import { Bell } from "lucide-react";
import { PartnerNotificationsList } from "@/components/partner-notifications-list";

export default function PartnerNotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Уведомления</h1>
          <p className="text-sm text-muted-foreground">
            Уведомления о заказах и статусе активностей
          </p>
        </div>
      </div>
      <PartnerNotificationsList />
    </div>
  );
}
