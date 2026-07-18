"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AgeVerificationOverlay() {
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  if (verified) return null;

  const handleNo = () => {
    router.push("/");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-sm rounded-xl border bg-card p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="mb-2 text-xl font-bold tracking-tight">18+</h2>
        <p className="mb-6 text-muted-foreground">Есть ли вам 18 лет?</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleNo}>
            Нет
          </Button>
          <Button className="flex-1" onClick={() => setVerified(true)}>
            Да
          </Button>
        </div>
      </div>
    </div>
  );
}
