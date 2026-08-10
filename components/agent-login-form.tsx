"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, Phone, UserCircle } from "lucide-react";
import { toast } from "sonner";

export function AgentLoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginEmail || !loginPassword) {
      toast.error("Заполните все поля");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/agent/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Ошибка входа");
        return;
      }

      toast.success("Добро пожаловать в кабинет агента!");
      localStorage.setItem("agent_token", data.token);
      router.replace("/agent");
    } catch {
      toast.error("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regName || !regPhone || !regEmail || !regPassword) {
      toast.error("Заполните все поля");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/agent/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          phone: regPhone,
          email: regEmail,
          password: regPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Ошибка регистрации");
        return;
      }

      toast.success("Добро пожаловать в кабинет агента!");
      localStorage.setItem("agent_token", data.token);
      router.replace("/agent");
    } catch {
      toast.error("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex mb-6 rounded-lg border p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === "login"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Вход
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === "register"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Регистрация
        </button>
      </div>

      {mode === "login" ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="agent-login-email"
              className="text-sm font-medium text-foreground"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="agent-login-email"
                type="email"
                placeholder="agent@email.ru"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="pl-10"
                autoComplete="email"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="agent-login-password"
              className="text-sm font-medium text-foreground"
            >
              Пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="agent-login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="pl-10"
                autoComplete="current-password"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="agent-reg-name"
              className="text-sm font-medium text-foreground"
            >
              Имя
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="agent-reg-name"
                type="text"
                placeholder="Иван Иванов"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="pl-10"
                autoComplete="name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="agent-reg-phone"
              className="text-sm font-medium text-foreground"
            >
              Телефон
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="agent-reg-phone"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="pl-10"
                autoComplete="tel"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="agent-reg-email"
              className="text-sm font-medium text-foreground"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="agent-reg-email"
                type="email"
                placeholder="agent@email.ru"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="pl-10"
                autoComplete="email"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="agent-reg-password"
              className="text-sm font-medium text-foreground"
            >
              Пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="agent-reg-password"
                type="password"
                placeholder="Не менее 6 символов"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="pl-10"
                autoComplete="new-password"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </Button>
        </form>
      )}

      <div className="mt-6 flex items-center justify-center gap-1 text-sm text-muted-foreground">
        <UserCircle className="h-4 w-4" />
        <span>Хотите стать агентом и получать процент с продаж?</span>
      </div>
    </div>
  );
}
