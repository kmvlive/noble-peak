import { CalendarDays } from "lucide-react";
import { PartnerListingCalendar } from "@/components/partner-listing-calendar";

export default async function PartnerListingCalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Календарь объявления
          </h1>
          <p className="text-sm text-muted-foreground">
            Управляйте доступностью, ценами по датам и минимальным сроком
            пребывания
          </p>
        </div>
      </div>
      <PartnerListingCalendar listingId={id} />
    </div>
  );
}
