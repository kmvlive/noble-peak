"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getAgentToken } from "@/components/agent-layout-client";

interface BankDetails {
  fullName: string;
  bankName: string;
  bik: string;
  accountNumber: string;
  correspondentAccount: string;
  inn?: string;
}

const EMPTY: BankDetails = {
  fullName: "",
  bankName: "",
  bik: "",
  accountNumber: "",
  correspondentAccount: "",
  inn: "",
};

export function AgentDetails() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<BankDetails | null>(null);
  const [form, setForm] = useState<BankDetails>(EMPTY);

  useEffect(() => {
    const token = getAgentToken();
    if (!token) {
      router.replace("/agent/login");
      return;
    }

    fetch("/api/agent/details", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          router.replace("/agent/login");
          throw new Error("Не авторизован");
        }
        if (!res.ok) throw new Error("Ошибка загрузки");
        return res.json();
      })
      .then((data) => {
        if (data.bankDetails) {
          setSaved(data.bankDetails);
          setForm({ ...EMPTY, ...data.bankDetails });
        }
      })
      .catch(() => {
        toast.error("Не удалось загрузить реквизиты");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleChange = (field: keyof BankDetails, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAgentToken();
    if (!token) return;

    setSaving(true);
    const id = toast.loading("Сохраняем...");

    try {
      const res = await fetch("/api/agent/details", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bankDetails: form }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка сохранения");
      }

      const data = await res.json();
      setSaved(data.bankDetails);
      toast.success("Готово", { id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка сохранения", {
        id,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  const fields: {
    key: keyof BankDetails;
    label: string;
    placeholder: string;
  }[] = [
    {
      key: "fullName",
      label: "ФИО получателя",
      placeholder: "Иванов Иван Иванович",
    },
    { key: "bankName", label: "Банк", placeholder: "ПАО Сбербанк" },
    { key: "bik", label: "БИК", placeholder: "044525225" },
    {
      key: "accountNumber",
      label: "Расчётный счёт",
      placeholder: "40817810000000001234",
    },
    {
      key: "correspondentAccount",
      label: "Корр. счёт",
      placeholder: "30101810400000000225",
    },
    { key: "inn", label: "ИНН (необязательно)", placeholder: "770012345678" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Реквизиты агента</h1>
        <p className="text-sm text-muted-foreground">
          Банковские реквизиты для выплат вознаграждения
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Банковские реквизиты</h2>
            <p className="text-sm text-muted-foreground">
              На эти реквизиты будут переводиться выплаты
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="text-sm font-medium">{field.label}</label>
              <Input
                value={form[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground italic">
          Реквизиты конфиденциальны и используются только для выплат
        </p>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
          {saved && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setForm({ ...EMPTY, ...saved })}
            >
              Сбросить изменения
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
