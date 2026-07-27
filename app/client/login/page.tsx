import { Suspense } from "react";
import { UserCircle } from "lucide-react";
import { ClientLoginForm } from "@/components/client-login-form";

export default function ClientLoginPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <UserCircle className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Личный кабинет</h1>
          <p className="text-sm text-muted-foreground">
            Войдите или зарегистрируйтесь
          </p>
        </div>
        <Suspense
          fallback={
            <div className="text-center text-muted-foreground">Загрузка...</div>
          }
        >
          <ClientLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
