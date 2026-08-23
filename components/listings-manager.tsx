"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Building2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HOUSING_TYPES,
  getHousingTypeLabel,
  getListingSubtypeLabel,
  getListingSubtypesForType,
} from "@noble-peak/shared";
import type { HousingType, ListingRecord } from "@noble-peak/shared";

interface FormState {
  title: string;
  description: string;
  housingType: HousingType;
  subtype: string;
  city: string;
  address: string;
  price: string;
  guests: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  housingType: "rooms",
  subtype: "",
  city: "",
  address: "",
  price: "",
  guests: "1",
};

export function ListingsManager({
  initialListings,
}: {
  initialListings: ListingRecord[];
}) {
  const [listings, setListings] = useState<ListingRecord[]>(initialListings);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const subtypes = getListingSubtypesForType(form.housingType);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function refresh() {
    try {
      const res = await fetch("/api/listings");
      const data = await res.json();
      setListings(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Не удалось загрузить объявления");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim() || !form.city.trim()) {
      toast.error("Заполните название и город");
      return;
    }
    if (!form.subtype) {
      toast.error("Выберите подтип жилья");
      return;
    }

    const price = Number(form.price);
    if (Number.isNaN(price) || price < 0) {
      toast.error("Укажите корректную цену");
      return;
    }

    setSaving(true);
    const id = toast.loading("Сохраняем объявление...");

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          images: [],
          housingType: form.housingType,
          subtype: form.subtype,
          city: form.city.trim(),
          address: form.address.trim() || undefined,
          price,
          guests: Number(form.guests) || 1,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Ошибка сохранения");
      }

      toast.success("Объявление добавлено", { id });
      setForm(EMPTY_FORM);
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ошибка сохранения",
        { id }
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/listings?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Ошибка удаления");
      }

      toast.success("Объявление удалено");
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка удаления");
    }
  }

  return (
    <div className="min-h-[calc(100vh-9rem)]">
      <section className="gradient-hero-vibrant border-b">
        <div className="container mx-auto max-w-5xl px-4 py-10 sm:py-14">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Объявления жилья
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Отдельная сущность объявлений по аренде жилья: выбор типа жилья и
            подтипа, собственное хранение и API.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Plus className="h-5 w-5 text-primary" />
                Новое объявление
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Тип жилья</Label>
                  <Select
                    value={form.housingType}
                    onValueChange={(value) =>
                      setField("housingType", (value ?? "rooms") as HousingType)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOUSING_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Подтип жилья</Label>
                  <Select
                    value={form.subtype || undefined}
                    onValueChange={(value) => setField("subtype", value ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите подтип" />
                    </SelectTrigger>
                    <SelectContent>
                      {subtypes.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    placeholder="Например, Студия у моря"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    rows={3}
                    placeholder="Краткое описание объявления"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Город</Label>
                    <Input
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      placeholder="Севастополь"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Адрес</Label>
                    <Input
                      value={form.address}
                      onChange={(e) => setField("address", e.target.value)}
                      placeholder="ул. Морская, 1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Цена, ₽/сутки</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.price}
                      onChange={(e) => setField("price", e.target.value)}
                      placeholder="3500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Число гостей</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.guests}
                      onChange={(e) => setField("guests", e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? "Сохраняем..." : "Добавить объявление"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="text-lg font-semibold">
              Объявления ({listings.length})
            </div>

            {listings.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <Building2 className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-muted-foreground">
                    Пока нет объявлений
                  </p>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Добавьте первое объявление, выбрав тип жилья и подтип.
                  </p>
                </CardContent>
              </Card>
            )}

            {listings.map((listing) => (
              <Card key={listing.id}>
                <CardContent className="flex items-start justify-between gap-4 py-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">
                        {listing.title}
                      </span>
                      <Badge variant="secondary">
                        {getHousingTypeLabel(listing.housingType)}
                      </Badge>
                      <Badge variant="outline">
                        {getListingSubtypeLabel(
                          listing.housingType,
                          listing.subtype
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {listing.city}
                      {listing.address ? ` · ${listing.address}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {listing.price.toLocaleString("ru-RU")} ₽/сутки ·{" "}
                      {listing.guests} гостей
                    </p>
                    {listing.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {listing.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Удалить объявление"
                    onClick={() => handleDelete(listing.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
