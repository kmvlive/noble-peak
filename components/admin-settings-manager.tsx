"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, Plus, Trash2, Star, Save, Loader2 } from "lucide-react";
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

interface Settings {
  emails: string[];
  defaultEmail: string;
}

export function AdminSettingsManager() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Ошибка загрузки настроек");
      const data = await res.json();
      setSettings({ emails: data.emails, defaultEmail: data.defaultEmail });
    } catch {
      toast.error("Не удалось загрузить настройки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const addEmail = () => {
    if (!newEmail) return;
    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Введите корректный email");
      return;
    }
    if (settings!.emails.includes(email)) {
      toast.error("Такой email уже добавлен");
      return;
    }
    setSettings((prev) => ({
      ...prev!,
      emails: [...prev!.emails, email],
      defaultEmail: prev!.emails.length === 0 ? email : prev!.defaultEmail,
    }));
    setNewEmail("");
    toast.success("Email добавлен");
  };

  const removeEmail = (email: string) => {
    if (settings!.emails.length <= 1) {
      toast.error("Должен быть хотя бы один email");
      return;
    }
    setSettings((prev) => ({
      ...prev!,
      emails: prev!.emails.filter((e) => e !== email),
      defaultEmail:
        prev!.defaultEmail === email
          ? prev!.emails.filter((e) => e !== email)[0]
          : prev!.defaultEmail,
    }));
    toast.success("Email удалён");
  };

  const setDefaultEmail = (email: string) => {
    setSettings((prev) => ({ ...prev!, defaultEmail: email }));
    toast.success(`Email по умолчанию: ${email}`);
  };

  const saveSettings = async () => {
    if (!settings) return;
    if (settings.emails.length === 0) {
      toast.error("Добавьте хотя бы один email");
      return;
    }
    if (!settings.emails.includes(settings.defaultEmail)) {
      toast.error("Email по умолчанию должен быть в списке");
      return;
    }
    setSaving(true);
    const id = toast.loading("Сохраняем...");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: settings.emails,
          defaultEmail: settings.defaultEmail,
        }),
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
        <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground">
          Управление email-ящиками для уведомлений
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email-ящики
          </CardTitle>
          <CardDescription>
            Email-адреса, на которые будут приходить уведомления о новых
            бронированиях и регистрациях
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="email@example.ru"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addEmail();
              }}
            />
            <Button onClick={addEmail} variant="outline">
              <Plus className="mr-1.5 h-4 w-4" />
              Добавить
            </Button>
          </div>

          {settings.emails.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Нет добавленных email-ящиков
            </p>
          ) : (
            <ul className="space-y-2">
              {settings.emails.map((email) => (
                <li
                  key={email}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div className="flex-1 truncate text-sm font-medium">
                    {email}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDefaultEmail(email)}
                    title="Сделать email по умолчанию"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        settings.defaultEmail === email
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeEmail(email)}
                    title="Удалить email"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {settings.defaultEmail && (
            <p className="text-xs text-muted-foreground">
              По умолчанию: <strong>{settings.defaultEmail}</strong>
            </p>
          )}

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
