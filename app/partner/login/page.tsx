import { Suspense } from "react";
import { UserCircle } from "lucide-react";
import { PartnerLoginForm } from "@/components/partner-login-form";

export default function PartnerLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <UserCircle className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Кабинет партнёра
          </h1>
          <p className="text-sm text-muted-foreground">
            Войдите или зарегистрируйтесь
          </p>
        </div>
        <Suspense
          fallback={
            <div className="text-center text-muted-foreground">Загрузка...</div>
          }
        >
          <PartnerLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
