import { ShoppingCart } from "lucide-react";
import { PartnerOrdersList } from "@/components/partner-orders-list";

export default async function PartnerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShoppingCart className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Заказы</h1>
          <p className="text-sm text-muted-foreground">
            Заказы клиентов на ваши активности
          </p>
        </div>
      </div>
      <PartnerOrdersList selectedOrderId={order} />
    </div>
  );
}
