"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getToken } from "@/components/admin-layout-client";
import type { PartnerRecord } from "@/lib/models";

export function AdminPartnersManager() {
  const [partners, setPartners] = useState<PartnerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchPartners = async () => {
    const token = getToken();
    try {
      const res = await fetch("/api/admin/partners", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setPartners(data);
    } catch {
      toast.error("Ошибка загрузки партнёров");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const toggleOrderForm = async (partner: PartnerRecord) => {
    const token = getToken();
    const newValue = !(partner.orderFormEnabled ?? true);
    setSaving(partner.email);

    try {
      const res = await fetch("/api/admin/partners", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: partner.email,
          orderFormEnabled: newValue,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка сохранения");
        return;
      }

      setPartners((prev) =>
        prev.map((p) =>
          p.email === partner.email ? { ...p, orderFormEnabled: newValue } : p
        )
      );
      toast.success(
        newValue
          ? "Форма заказа включена для партнёра"
          : "Форма заказа отключена для партнёра"
      );
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Users className="h-8 w-8" />
        </div>
        <p className="text-lg font-medium">Нет партнёров</p>
        <p className="text-sm">
          Партнёры появятся после регистрации в личном кабинете партнёра
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Имя
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Email
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Телефон
            </th>
            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
              Форма заказа
            </th>
          </tr>
        </thead>
        <tbody>
          {partners.map((partner) => (
            <tr key={partner.email} className="border-b last:border-b-0">
              <td className="px-4 py-3 text-sm">{partner.name}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {partner.email}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {partner.phone}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={saving === partner.email}
                  onClick={() => toggleOrderForm(partner)}
                  className="inline-flex items-center gap-2"
                >
                  {saving === partner.email ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (partner.orderFormEnabled ?? true) ? (
                    <ToggleRight className="h-5 w-5 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span
                    className={
                      (partner.orderFormEnabled ?? true)
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }
                  >
                    {(partner.orderFormEnabled ?? true) ? "Вкл" : "Выкл"}
                  </span>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
