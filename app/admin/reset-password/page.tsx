import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function AdminResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Новый пароль</h1>
          <p className="text-sm text-muted-foreground">
            Введите новый пароль для входа в админ-панель
          </p>
        </div>
        <Suspense
          fallback={
            <div className="text-center text-sm text-muted-foreground">
              Загрузка...
            </div>
          }
        >
          <ResetPasswordForm
            apiEndpoint="/api/admin/reset-password"
            loginLink="/admin/login"
            loginLabel="Войти в админ-панель"
          />
        </Suspense>
      </div>
    </div>
  );
}
