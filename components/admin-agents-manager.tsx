"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  Loader2,
  Save,
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  Phone,
  Mail,
  User,
  Hash,
  Banknote,
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

interface PartnerItem {
  email: string;
  name: string;
  phone: string;
  partnerNumber: string;
}

interface AgentDetail {
  email: string;
  name: string;
  phone: string;
  code: string;
  blocked: boolean;
  createdAt: string;
  bankDetails: {
    fullName?: string;
    bankName?: string;
    accountNumber?: string;
  } | null;
  currentRatePercent: number;
  partnersCount: number;
}

export function AdminAgentsManager() {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tier2, setTier2] = useState("");
  const [tier3, setTier3] = useState("");

  const [detail, setDetail] = useState<{
    agent: AgentDetail;
    partners: PartnerItem[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [blocking, setBlocking] = useState(false);

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

  const openDetail = async (agent: AgentItem) => {
    setDetailLoading(true);
    setDetail(null);
    const token = getToken();
    try {
      const res = await fetch(
        `/api/admin/agents/${encodeURIComponent(agent.email)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Ошибка загрузки");
        return;
      }
      const data = await res.json();
      setDetail({
        agent: data.agent,
        partners: Array.isArray(data.partners) ? data.partners : [],
      });
    } catch {
      toast.error("Ошибка загрузки");
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleBlock = async () => {
    if (!detail) return;
    const nextBlocked = !detail.agent.blocked;
    setBlocking(true);
    const token = getToken();
    try {
      const res = await fetch(
        `/api/admin/agents/${encodeURIComponent(detail.agent.email)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ blocked: nextBlocked }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Ошибка обновления");
        return;
      }
      const saved = await res.json();
      setDetail((d) =>
        d ? { ...d, agent: { ...d.agent, blocked: saved.blocked } } : d
      );
      toast.success(
        saved.blocked ? "Агент заблокирован" : "Агент разблокирован"
      );
      fetchAgents();
    } catch {
      toast.error("Ошибка обновления");
    } finally {
      setBlocking(false);
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

  if (detail || detailLoading) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDetail(null)}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к списку агентов
        </Button>

        {detailLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full max-w-2xl" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : detail ? (
          <>
            <div className="rounded-xl border bg-card p-5 space-y-4 max-w-2xl">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight truncate">
                      {detail.agent.name}
                    </h2>
                    {detail.agent.blocked ? (
                      <ShieldAlert className="h-4 w-4 text-destructive" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <span
                    className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      detail.agent.blocked
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    }`}
                  >
                    {detail.agent.blocked ? "Заблокирован" : "Активен"}
                  </span>
                </div>
                <Button
                  variant={detail.agent.blocked ? "outline" : "destructive"}
                  size="sm"
                  onClick={toggleBlock}
                  disabled={blocking}
                >
                  {blocking ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : detail.agent.blocked ? (
                    <ShieldCheck className="mr-1.5 h-4 w-4" />
                  ) : (
                    <ShieldAlert className="mr-1.5 h-4 w-4" />
                  )}
                  {detail.agent.blocked ? "Разблокировать" : "Заблокировать"}
                </Button>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{detail.agent.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{detail.agent.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="h-4 w-4 shrink-0" />
                  <span>Код: {detail.agent.code}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 shrink-0" />
                  <span>
                    Зарегистрирован:{" "}
                    {new Date(detail.agent.createdAt).toLocaleDateString(
                      "ru-RU"
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Banknote className="h-4 w-4 shrink-0" />
                  <span>
                    Ставка в этом месяце: {detail.agent.currentRatePercent}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>Партнёров: {detail.agent.partnersCount}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold tracking-tight">
                  Партнёры агента
                </h3>
              </div>

              {detail.partners.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    У агента пока нет партнёров
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                        <th className="px-4 py-2.5 font-medium">Имя</th>
                        <th className="px-4 py-2.5 font-medium">Телефон</th>
                        <th className="px-4 py-2.5 font-medium">Email</th>
                        <th className="px-4 py-2.5 font-medium">Номер</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.partners.map((p) => (
                        <tr key={p.email} className="border-b last:border-0">
                          <td className="px-4 py-2.5 font-medium">{p.name}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {p.phone}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {p.email}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {p.partnerNumber || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
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
              <button
                key={agent.email}
                type="button"
                onClick={() => openDetail(agent)}
                className="flex w-full flex-col gap-2 rounded-lg border p-4 text-left transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
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
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
