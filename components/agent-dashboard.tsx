"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Link2,
  MousePointerClick,
  UserPlus,
  Wallet,
  FileText,
  UserCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AgentInfo {
  name: string;
  phone: string;
  email: string;
  code: string;
}

interface Stats {
  clicks30: number;
  registrations30: number;
  earnings: number;
}

interface Article {
  id: string;
  title: string;
  content: string;
}

interface DashboardData {
  agent: AgentInfo;
  stats: Stats;
  articles: Article[];
}

function formatRubles(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AgentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agent/dashboard")
      .then((res) => {
        if (res.status === 401) {
          router.replace("/agent/login");
          throw new Error("Не авторизован");
        }
        if (!res.ok) throw new Error("Ошибка загрузки");
        return res.json();
      })
      .then((payload) => {
        if (payload.agent) setData(payload);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-28 w-full max-w-md" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-32 w-full max-w-2xl" />
      </div>
    );
  }

  if (!data) return null;

  const { agent, stats, articles } = data;

  const partnerLink = `${typeof window !== "undefined" ? window.location.origin : ""}/partner/login?ref=${agent.code}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(partnerLink);
      toast.success("Ссылка скопирована");
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Кабинет агента</h1>
        <p className="text-sm text-muted-foreground">
          Добро пожаловать, {agent.name}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MousePointerClick className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {stats.clicks30}
          </div>
          <div className="text-sm text-muted-foreground">
            Переходов за 30 дней
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {stats.registrations30}
          </div>
          <div className="text-sm text-muted-foreground">
            Регистраций партнёров за 30 дней
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {formatRubles(stats.earnings)}
          </div>
          <div className="text-sm text-muted-foreground">Заработок</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Код агента</div>
              <div className="text-lg font-semibold tracking-tight">
                {agent.code}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Link2 className="h-4 w-4" />
            Партнёрская ссылка
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Партнёры, зарегистрировавшиеся по этой ссылке, автоматически
            привяжутся к вам.
          </p>
          <div className="rounded-md border bg-muted px-3 py-2 text-sm break-all">
            {partnerLink}
          </div>
          <Button className="mt-3" size="sm" onClick={copyLink}>
            Скопировать ссылку
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">
            Информация агентам
          </h2>
        </div>

        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Информации пока нет</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {articles.map((page) => (
              <div
                key={page.id}
                className="rounded-xl border bg-card p-4 space-y-2 card-hover"
              >
                <h3 className="font-semibold">{page.title}</h3>
                <div
                  className="prose prose-sm max-w-none text-muted-foreground line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: page.content }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
