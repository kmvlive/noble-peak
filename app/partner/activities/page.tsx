import { List } from "lucide-react";
import { PartnerActivitiesList } from "@/components/partner-activities-list";

export default function PartnerActivitiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <List className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Мои активности</h1>
          <p className="text-sm text-muted-foreground">
            Все активности, которые вы добавили
          </p>
        </div>
      </div>
      <PartnerActivitiesList />
    </div>
  );
}
