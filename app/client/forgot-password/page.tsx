import { UserCircle } from "lucide-react";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ClientForgotPasswordPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <UserCircle className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Восстановление пароля
          </h1>
          <p className="text-sm text-muted-foreground">
            Введите email, указанный при регистрации
          </p>
        </div>
        <ForgotPasswordForm
          apiEndpoint="/api/client/forgot-password"
          backLink="/client/login"
          backLabel="Вернуться ко входу"
        />
      </div>
    </div>
  );
}
