"use client";

import { useState, useEffect, useCallback } from "react";
import { CreditCard, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";

interface PaymentSettings {
  terminalKey: string;
  password: string;
  webhookUrl: string;
}

export function AdminPaymentSettingsManager() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/payment-settings");
      if (!res.ok) throw new Error("Ошибка загрузки настроек");
      const data = await res.json();
      setSettings({
        terminalKey: data.terminalKey,
        password: data.password,
        webhookUrl: data.webhookUrl,
      });
    } catch {
      toast.error("Не удалось загрузить настройки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async () => {
    if (!settings) return;
    if (!settings.terminalKey.trim()) {
      toast.error("Введите TerminalKey");
      return;
    }
    if (!settings.password.trim()) {
      toast.error("Введите Password");
      return;
    }
    if (!settings.webhookUrl.trim()) {
      toast.error("Введите Webhook URL");
      return;
    }

    setSaving(true);
    const id = toast.loading("Сохраняем...");
    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка сохранения");
      }
      toast.success("Настройки сохранены", { id });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка сохранения", {
        id,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Платёжная система</h1>
        <p className="text-muted-foreground">Настройки интеграции с Т-банком</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Т-Банк (Tinkoff)
          </CardTitle>
          <CardDescription>
            Параметры подключения к платёжному шлюзу Т-банка
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="terminalKey" className="text-sm font-medium">
              TerminalKey
            </label>
            <Input
              id="terminalKey"
              placeholder="Tinkoff Terminal Key"
              value={settings.terminalKey}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev!,
                  terminalKey: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Пароль от терминала"
                value={settings.password}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev!,
                    password: e.target.value,
                  }))
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="webhookUrl" className="text-sm font-medium">
              Webhook URL
            </label>
            <Input
              id="webhookUrl"
              placeholder="https://example.com/api/payment/webhook"
              type="url"
              value={settings.webhookUrl}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev!,
                  webhookUrl: e.target.value,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              URL для получения уведомлений о статусе платежей от Т-банка
            </p>
          </div>

          <Button onClick={saveSettings} disabled={saving} className="w-full">
            {saving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Сохранить настройки
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
