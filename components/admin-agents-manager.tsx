"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  Loader2,
  Save,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getToken } from "@/components/admin-layout-client";

interface AgentItem {
  email: string;
  name: string;
  phone: string;
  code: string;
  blocked: boolean;
  createdAt: string;
  partnersCount: number;
  currentRatePercent: number;
}

interface Settings {
  id: string;
  tier2Threshold: number;
  tier3Threshold: number;
  updatedAt: string;
}

export function AdminAgentsManager() {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tier2, setTier2] = useState("");
  const [tier3, setTier3] = useState("");

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    const token = getToken();
    try {
      const res = await fetch("/api/admin/agents", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Ошибка загрузки");
        return;
      }
      const data = await res.json();
      setAgents(Array.isArray(data.agents) ? data.agents : []);
      if (data.settings) {
        setSettings(data.settings);
        setTier2(String(data.settings.tier2Threshold));
        setTier3(String(data.settings.tier3Threshold));
      }
    } catch {
      toast.error("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const t2 = Number(tier2);
    const t3 = Number(tier3);
    if (isNaN(t2) || isNaN(t3) || t2 < 0 || t3 < 0) {
      toast.error("Введите корректные пороги в рублях");
      return;
    }
    if (t3 <= t2) {
      toast.error("Порог 5% должен быть больше порога 4%");
      return;
    }

    setSaving(true);
    const token = getToken();
    try {
      const res = await fetch("/api/admin/agents", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tier2Threshold: t2,
          tier3Threshold: t3,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Ошибка сохранения");
        return;
      }
      const saved = await res.json();
      setSettings(saved);
      toast.success("Пороги лесенки сохранены");
      fetchAgents();
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full max-w-2xl" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border bg-card p-5 space-y-4 max-w-2xl">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">
            Лесенка агентской комиссии
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Комиссия агента от объёма продаж его партнёров за месяц: до второго
          порога — 3%, от второго до третьего — 4%, от третьего — 5%.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Порог 4% (рублей в месяц)
            </label>
            <Input
              type="number"
              min={0}
              value={tier2}
              onChange={(e) => setTier2(e.target.value)}
              placeholder="100000"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Порог 5% (рублей в месяц)
            </label>
            <Input
              type="number"
              min={0}
              value={tier3}
              onChange={(e) => setTier3(e.target.value)}
              placeholder="300000"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Сохранить пороги
          </Button>
          {settings?.updatedAt && (
            <span className="text-xs text-muted-foreground">
              Обновлено:{" "}
              {new Date(settings.updatedAt).toLocaleDateString("ru-RU")}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">
            Зарегистрированные агенты
          </h2>
        </div>

        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Агентов пока нет</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => (
              <div
                key={agent.email}
                className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{agent.name}</span>
                    {agent.blocked ? (
                      <ShieldAlert className="h-4 w-4 text-destructive" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{agent.email}</span>
                    <span>Код: {agent.code}</span>
                    <span>Партнёров: {agent.partnersCount}</span>
                    <span>
                      Ставка в этом месяце: {agent.currentRatePercent}%
                    </span>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    agent.blocked
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  }`}
                >
                  {agent.blocked ? "Заблокирован" : "Активен"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
