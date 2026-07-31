"use client";

import { useState, useEffect } from "react";
import { Lock, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export function GuestSetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("guest_token");
    if (t) setToken(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Пароль должен быть не менее 6 символов");
      return;
    }

    if (password !== confirm) {
      toast.error("Пароли не совпадают");
      return;
    }

    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch("/api/client/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Ошибка при установке пароля");
        return;
      }

      localStorage.removeItem("guest_token");
      setSuccess(true);
      toast.success(
        "Пароль установлен! Теперь вы можете войти в личный кабинет"
      );
    } catch {
      toast.error("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.removeItem("guest_token");
    setSkipped(true);
  };

  if (!token) return null;

  if (success || skipped) {
    return (
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle className="h-5 w-5" />
          <p className="text-sm font-medium">
            {success
              ? "Пароль установлен"
              : "Вы можете установить пароль позже в личном кабинете"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/client/login"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Войти в личный кабинет
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lock className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm font-medium">
          Установите пароль для личного кабинета
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Вы можете установить пароль сейчас или сделать это позже. С паролем вы
        сможете отслеживать бронирования в личном кабинете.
      </p>
      <div className="space-y-2">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Придумайте пароль (не менее 6 символов)"
          className="pl-3"
        />
        <Input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Повторите пароль"
          className="pl-3"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Сохраняем..." : "Установить пароль"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleSkip}
          disabled={loading}
        >
          Пропустить
        </Button>
      </div>
    </form>
  );
}
