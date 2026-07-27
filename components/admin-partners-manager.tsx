"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Mail,
  Phone,
  User,
  FileText,
  Building2,
  IdCard,
  CalendarDays,
  StickyNote,
  Globe,
  UserCheck,
  BookOpen,
  BadgeInfo,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getToken } from "@/components/admin-layout-client";
import type { PartnerRecord } from "@/lib/models";

const statusLabels: Record<string, string> = {
  individual: "Физлицо",
  ip: "ИП",
  legal_entity: "Юрлицо",
};

const documentLabels: Record<string, string> = {
  passport_rf: "Паспорт гражданина РФ",
  passport_foreign: "Паспорт другой страны",
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | undefined | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">
          {value || <span className="text-muted-foreground/50">—</span>}
        </p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
      {children}
    </h3>
  );
}

function PartnerInfoDialog({
  open,
  onOpenChange,
  partner,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: PartnerRecord | null;
}) {
  if (!partner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {partner.name}
          </DialogTitle>
          <DialogDescription>
            Анкетные и юридические данные партнёра
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-3">
            <SectionTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
              Анкетные данные
            </SectionTitle>
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <InfoRow
                icon={<IdCard className="h-4 w-4" />}
                label="Номер документа"
                value={partner.documentNumber}
              />
            </div>
          </div>

          <div className="space-y-3">
            <SectionTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Юридические данные
            </SectionTitle>
            {partner.legalData ? (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <InfoRow
                  icon={<Globe className="h-4 w-4" />}
                  label="Страна"
                  value={partner.legalData.country}
                />
                <Separator />
                <InfoRow
                  icon={<UserCheck className="h-4 w-4" />}
                  label="Статус"
                  value={
                    statusLabels[partner.legalData.status] ||
                    partner.legalData.status
                  }
                />
                <Separator />
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Фамилия, имя, отчество"
                  value={partner.legalData.fullName}
                />
                <Separator />
                <InfoRow
                  icon={<BookOpen className="h-4 w-4" />}
                  label="Документ"
                  value={
                    documentLabels[partner.legalData.document] ||
                    partner.legalData.document
                  }
                />
                <Separator />
                <InfoRow
                  icon={<BadgeInfo className="h-4 w-4" />}
                  label="Серия и номер"
                  value={partner.legalData.documentSeriesNumber}
                />
                <Separator />
                <InfoRow
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Дата выдачи"
                  value={partner.legalData.issueDate}
                />
                <Separator />
                <InfoRow
                  icon={<StickyNote className="h-4 w-4" />}
                  label="ИНН"
                  value={partner.legalData.tin}
                />
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                Юридические данные не заполнены
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminPartnersManager() {
  const [partners, setPartners] = useState<PartnerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<PartnerRecord | null>(
    null
  );

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

  const openPartnerInfo = (partner: PartnerRecord) => {
    setSelectedPartner(partner);
    setDialogOpen(true);
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
    <>
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
              <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                Данные
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
                <td className="px-4 py-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openPartnerInfo(partner)}
                    className="inline-flex items-center gap-1"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-xs">Анкета</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PartnerInfoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        partner={selectedPartner}
      />
    </>
  );
}
