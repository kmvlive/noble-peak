"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, UserCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AgentInfo {
  name: string;
  phone: string;
  email: string;
  code: string;
}

export function AgentDashboard() {
  const router = useRouter();
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agent/me")
      .then((res) => {
        if (res.status === 401) {
          router.replace("/agent/login");
          throw new Error("Не авторизован");
        }
        return res.json();
      })
      .then((data) => {
        if (data.agent) setAgent(data.agent);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full max-w-md" />
      </div>
    );
  }

  if (!agent) return null;

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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Кабинет агента</h1>
        <p className="text-sm text-muted-foreground">
          Добро пожаловать, {agent.name}
        </p>
      </div>

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
  );
}
