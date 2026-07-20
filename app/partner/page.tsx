import { Sparkles } from "lucide-react";

export default function PartnerPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
        <Sparkles className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Добро пожаловать в кабинет партнёра
      </h1>
      <p className="text-muted-foreground max-w-md">
        Здесь вы можете добавлять активности, управлять заказами и отслеживать
        свой календарь.
      </p>
    </div>
  );
}
