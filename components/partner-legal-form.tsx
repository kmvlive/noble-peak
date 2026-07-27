"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Scale, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getToken } from "@/components/partner-layout-client";

interface LegalData {
  country: string;
  status: "individual" | "ip" | "legal_entity";
  fullName: string;
  document: "passport_rf" | "passport_foreign";
  documentSeriesNumber: string;
  issueDate: string;
  tin: string;
}

const STATUS_LABELS: Record<LegalData["status"], string> = {
  individual: "Физлицо",
  ip: "ИП",
  legal_entity: "Юрлицо",
};

const DOCUMENT_LABELS: Record<LegalData["document"], string> = {
  passport_rf: "Паспорт гражданина РФ",
  passport_foreign: "Паспорт другой страны",
};

export function PartnerLegalForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedData, setSavedData] = useState<LegalData | null>(null);
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState<LegalData["status"]>("individual");
  const [fullName, setFullName] = useState("");
  const [document, setDocument] =
    useState<LegalData["document"]>("passport_rf");
  const [documentSeriesNumber, setDocumentSeriesNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [tin, setTin] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/partner/login");
      return;
    }

    fetch("/api/partner/legal", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка загрузки");
        return res.json();
      })
      .then((data: { legalData: LegalData | null }) => {
        if (data.legalData) {
          setSavedData(data.legalData);
          setCountry(data.legalData.country);
          setStatus(data.legalData.status);
          setFullName(data.legalData.fullName);
          setDocument(data.legalData.document);
          setDocumentSeriesNumber(data.legalData.documentSeriesNumber);
          setIssueDate(data.legalData.issueDate);
          setTin(data.legalData.tin);
        }
      })
      .catch(() => {
        toast.error("Не удалось загрузить юридические данные");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = getToken();
    if (!token) return;

    setSaving(true);
    const id = toast.loading("Сохраняем...");

    try {
      const res = await fetch("/api/partner/legal", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          legalData: {
            country: country.trim(),
            status,
            fullName: fullName.trim(),
            document,
            documentSeriesNumber: documentSeriesNumber.trim(),
            issueDate: issueDate.trim(),
            tin: tin.trim(),
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка сохранения");
      }

      const data = await res.json();
      setSavedData(data.legalData);
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
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  if (savedData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Scale className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Юридические данные</h2>
            <p className="text-sm text-muted-foreground">
              Данные сохранены и защищены
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/50 divide-y">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">Страна</span>
            <span className="text-sm font-medium">{savedData.country}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">Статус</span>
            <span className="text-sm font-medium">
              {STATUS_LABELS[savedData.status]}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">ФИО</span>
            <span className="text-sm font-medium">{savedData.fullName}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">Документ</span>
            <span className="text-sm font-medium">
              {DOCUMENT_LABELS[savedData.document]}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">Серия и номер</span>
            <span className="text-sm font-medium">
              {savedData.documentSeriesNumber}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">Дата выдачи</span>
            <span className="text-sm font-medium">{savedData.issueDate}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">ИНН</span>
            <span className="text-sm font-medium">{savedData.tin}</span>
          </div>
        </div>

        <Button variant="outline" onClick={() => setSavedData(null)}>
          Редактировать
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Scale className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Юридические данные</h2>
          <p className="text-sm text-muted-foreground">
            Заполните юридическую информацию
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="country" className="text-sm font-medium">
          Страна
        </label>
        <Input
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Россия"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="status" className="text-sm font-medium">
          Статус
        </label>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as LegalData["status"])}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Выберите статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="individual">Физлицо</SelectItem>
            <SelectItem value="ip">ИП</SelectItem>
            <SelectItem value="legal_entity">Юрлицо</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium">
          Фамилия имя и отчество
        </label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Иванов Иван Иванович"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="document" className="text-sm font-medium">
          Документ
        </label>
        <Select
          value={document}
          onValueChange={(v) => setDocument(v as LegalData["document"])}
        >
          <SelectTrigger id="document">
            <SelectValue placeholder="Выберите документ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="passport_rf">Паспорт гражданина РФ</SelectItem>
            <SelectItem value="passport_foreign">
              Паспорт другой страны
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="documentSeriesNumber" className="text-sm font-medium">
          Серия и номер
        </label>
        <Input
          id="documentSeriesNumber"
          value={documentSeriesNumber}
          onChange={(e) => setDocumentSeriesNumber(e.target.value)}
          placeholder="4510 123456"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="issueDate" className="text-sm font-medium">
          Дата выдачи
        </label>
        <Input
          id="issueDate"
          type="date"
          value={issueDate}
          onChange={(e) => setIssueDate(e.target.value)}
        />
      </div>

      <p className="text-xs text-muted-foreground italic">
        Паспорт конфиденциален
      </p>

      <div className="space-y-2">
        <label htmlFor="tin" className="text-sm font-medium">
          ИНН
        </label>
        <Input
          id="tin"
          value={tin}
          onChange={(e) => setTin(e.target.value)}
          placeholder="770012345678"
        />
      </div>

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Сохранить
      </Button>
    </form>
  );
}
