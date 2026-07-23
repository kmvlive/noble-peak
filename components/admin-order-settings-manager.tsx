"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";

interface OrderSettings {
  orderFormEnabled: boolean;
}

export function AdminOrderSettingsManager() {
  const [settings, setSettings] = useState<OrderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/order-settings");
      if (!res.ok) throw new Error("Ошибка загрузки настроек");
      const data = await res.json();
      setSettings({
        orderFormEnabled: data.orderFormEnabled,
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

    setSaving(true);
    const id = toast.loading("Сохраняем...");
    try {
      const res = await fetch("/api/admin/order-settings", {
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
        <h1 className="text-2xl font-bold tracking-tight">Варианты заказа</h1>
        <p className="text-muted-foreground">
          Глобальная настройка способа приёма заказов для активностей
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Форма заказа
          </CardTitle>
          <CardDescription>
            Разрешить или запретить использование формы заказа для активностей
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Форма заказа</p>
              <p className="text-xs text-muted-foreground">
                {settings.orderFormEnabled
                  ? "Форма заказа доступна — клиенты могут заполнять форму бронирования"
                  : "Форма заказа запрещена — новые активности создаются с типом «Оплата»"}
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={settings.orderFormEnabled}
                onChange={() =>
                  setSettings((prev) => ({
                    ...prev!,
                    orderFormEnabled: !prev!.orderFormEnabled,
                  }))
                }
              />
              <div className="peer h-6 w-11 rounded-full border bg-input after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:bg-background after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2" />
              <span className="ml-3 text-sm font-medium">
                {settings.orderFormEnabled ? "Включено" : "Выключено"}
              </span>
            </label>
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
