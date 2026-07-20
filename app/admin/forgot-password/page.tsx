import { Sparkles } from "lucide-react";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function AdminForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Восстановление пароля
          </h1>
          <p className="text-sm text-muted-foreground">
            Введите email, привязанный к аккаунту администратора
          </p>
        </div>
        <ForgotPasswordForm
          apiEndpoint="/api/admin/forgot-password"
          backLink="/admin/login"
          backLabel="Вернуться ко входу"
        />
      </div>
    </div>
  );
}
