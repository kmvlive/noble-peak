import { CalendarRange } from "lucide-react";
import { PartnerRentalCalendar } from "@/components/partner-rental-calendar";

export default function PartnerRentalCalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarRange className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Календарь сдачи</h1>
          <p className="text-sm text-muted-foreground">
            Управляйте доступностью дат сдачи ваших объявлений
          </p>
        </div>
      </div>
      <PartnerRentalCalendar />
    </div>
  );
}
