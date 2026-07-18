import { Metadata } from "next";
import { Suspense } from "react";
import { appName } from "@/lib/app-name";
import { PaymentPageContent } from "@/components/payment-page-content";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: `Оплата — ${appName}`,
};

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
}
