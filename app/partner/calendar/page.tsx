import { CalendarDays } from "lucide-react";
import { PartnerCalendar } from "@/components/partner-calendar";

export default function PartnerCalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Календарь</h1>
          <p className="text-sm text-muted-foreground">
            Даты с активными заказами на ваши активности
          </p>
        </div>
      </div>
      <PartnerCalendar />
    </div>
  );
}
