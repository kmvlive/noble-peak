"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, UserCircle, Mail, Phone, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Partner {
  email: string;
  name: string;
  phone: string;
  photo?: string;
  partnerNumber?: string;
  createdAt: string;
}

export function AgentPartners() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [number, setNumber] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/agent/partners")
      .then((res) => {
        if (res.status === 401) {
          router.replace("/agent/login");
          throw new Error("Не авторизован");
        }
        if (!res.ok) throw new Error("Ошибка загрузки");
        return res.json();
      })
      .then((payload) => {
        if (Array.isArray(payload.partners)) setPartners(payload.partners);
      })
      .catch((err) => {
        toast.error(err?.message || "Ошибка загрузки партнёров");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const addByNumber = async () => {
    if (!number.trim()) {
      toast.error("Введите номер партнёра");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/agent/partner-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerNumber: number.trim() }),
      });
      if (res.status === 401) {
        router.replace("/agent/login");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Ошибка добавления партнёра");
      setNumber("");
      toast.success("Запрос на привязку отправлен партнёру");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Партнёры</h1>
        <p className="text-sm text-muted-foreground">
          Партнёры, зарегистрировавшиеся по вашей ссылке и привязанные к вам.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserPlus className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Добавить партнёра по номеру</p>
            <p className="text-xs text-muted-foreground">
              Партнёру будет отправлен запрос на привязку, который он может
              принять или отклонить.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Например, PRT-123456"
            className="font-mono sm:max-w-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") addByNumber();
            }}
          />
          <Button onClick={addByNumber} disabled={adding}>
            Отправить запрос
          </Button>
        </div>
      </div>

      {partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Партнёров пока нет. Поделитесь вашей партнёрской ссылкой из
            дашборда.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {partners.map((partner) => (
            <div
              key={partner.email}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 card-hover"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                {partner.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={partner.photo}
                    alt={partner.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="font-semibold truncate">{partner.name}</div>
                {partner.partnerNumber ? (
                  <div className="font-mono text-xs text-primary">
                    {partner.partnerNumber}
                  </div>
                ) : null}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{partner.email}</span>
                </div>
                {partner.phone ? (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span className="truncate">{partner.phone}</span>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
