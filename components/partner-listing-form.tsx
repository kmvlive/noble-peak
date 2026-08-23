"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BedDouble,
  Building2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Plus,
  Send,
  Trash2,
  Upload,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HOUSING_TYPES, getListingSubtypesForType } from "@noble-peak/shared";
import type { HousingType, ListingRoom } from "@noble-peak/shared";
import { getToken } from "./partner-layout-client";
import { CityAutocomplete } from "./city-autocomplete";
import { createPartnerListingSchema } from "@/lib/validation/listing";

const STEPS = [
  { title: "Основная информация", icon: Building2 },
  { title: "Фотографии", icon: ImageIcon },
  { title: "Номера", icon: BedDouble },
  { title: "Питание", icon: Utensils },
];

interface RoomDraft {
  id: string;
  name: string;
  capacity: string;
  price: string;
}

function emptyRoom(): RoomDraft {
  return { id: crypto.randomUUID(), name: "", capacity: "2", price: "" };
}

export function PartnerListingForm() {
  const router = useRouter();

  const [housingType, setHousingType] = useState<HousingType | null>(null);
  const [step, setStep] = useState(0);

  const [subtype, setSubtype] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rooms, setRooms] = useState<RoomDraft[]>([emptyRoom()]);
  const [meals, setMeals] = useState<string[]>([""]);

  const [saving, setSaving] = useState(false);

  const subtypes = housingType ? getListingSubtypesForType(housingType) : [];

  const selectType = (type: HousingType) => {
    setHousingType(type);
    if (type === "rooms") {
      setStep(0);
      return;
    }
    setStep(-1);
  };

  const canProceedFromStep = (): boolean => {
    if (step === 0) {
      return Boolean(subtype && title.trim() && city.trim());
    }
    if (step === 1) return true;
    if (step === 2) {
      const valid = rooms.some(
        (r) =>
          Number(r.capacity) >= 1 &&
          !Number.isNaN(Number(r.capacity)) &&
          Number(r.price) >= 0 &&
          !Number.isNaN(Number(r.price))
      );
      return valid;
    }
    return true;
  };

  const nextStep = () => {
    if (!canProceedFromStep()) {
      toast.error("Заполните обязательные поля шага");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const addRoom = () => setRooms((prev) => [...prev, emptyRoom()]);

  const updateRoom = (id: string, patch: Partial<RoomDraft>) => {
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRoom = (id: string) => {
    setRooms((prev) =>
      prev.length === 1 ? prev : prev.filter((r) => r.id !== id)
    );
  };

  const updateMeal = (index: number, value: string) => {
    setMeals((prev) => prev.map((m, i) => (i === index ? value : m)));
  };

  const removeMeal = (index: number) => {
    setMeals((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
    );
  };

  const addImageUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    if (images.includes(url)) return;
    setImages((prev) => [...prev, url]);
    setNewImageUrl("");
  };

  const removeImageUrl = (url: string) => {
    setImages((prev) => prev.filter((u) => u !== url));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 30 - images.length;
    if (remaining <= 0) {
      toast.error("Максимум 30 фотографий");
      return;
    }

    setUploading(true);
    const token = getToken();
    const formData = new FormData();
    const filesToUpload = Array.from(files).slice(0, remaining);
    for (const file of filesToUpload) {
      formData.append("file", file);
    }

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Ошибка загрузки");
        return;
      }
      setImages((prev) => [...prev, ...data.urls]);
      toast.success(`Загружено ${data.urls.length} фото`);
    } catch {
      toast.error("Ошибка загрузки файлов");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isImageUrl = (url: string) => {
    return url.startsWith("http") || url.startsWith("/uploads/");
  };

  const handleSubmit = async () => {
    const normalizedRooms: ListingRoom[] = rooms
      .filter(
        (r) =>
          !Number.isNaN(Number(r.capacity)) &&
          Number(r.capacity) >= 1 &&
          !Number.isNaN(Number(r.price)) &&
          Number(r.price) >= 0
      )
      .map((r) => ({
        name: r.name.trim() || undefined,
        capacity: Number(r.capacity),
        price: Number(r.price),
      }));

    const payload = {
      housingType: housingType as HousingType,
      subtype,
      title: title.trim(),
      description: description.trim(),
      city: city.trim(),
      address: address.trim() || undefined,
      images,
      rooms: normalizedRooms,
      meals: meals.map((m) => m.trim()).filter((m) => m.length > 0),
    };

    const parsed = createPartnerListingSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error("Некорректные данные формы");
      return;
    }

    setSaving(true);
    const id = toast.loading("Отправляем объявление...");

    try {
      const token = getToken();
      const res = await fetch("/api/partner/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ошибка сохранения");
      }

      toast.success("Объявление отправлено на модерацию", { id });
      router.push("/partner");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ошибка сохранения",
        { id }
      );
    } finally {
      setSaving(false);
    }
  };

  if (housingType && housingType !== "rooms") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Добавить объявление
        </h1>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <BedDouble className="h-5 w-5 text-primary" />
              {HOUSING_TYPES.find((t) => t.value === housingType)?.label}
            </div>
            <p className="text-sm text-muted-foreground">
              Этот тип объявления будет доступен в ближайшее время. Сейчас можно
              добавить объявление типа «Номера / спальные места».
            </p>
            <Button variant="outline" onClick={() => selectType("rooms")}>
              <ChevronLeft className="mr-1.5 h-4 w-4" />
              Выбрать «Номера / спальные места»
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!housingType) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Добавить объявление
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Выберите тип жилья. Объявление пройдёт модерацию перед публикацией.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {HOUSING_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => selectType(t.value)}
              className="flex flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary card-hover"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BedDouble className="h-5 w-5" />
              </div>
              <span className="font-semibold">{t.label}</span>
              <span className="text-xs text-muted-foreground">
                {t.subtypes.map((s) => s.label).join(", ")}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Добавить объявление
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Номера / спальные места · После отправки объявление уйдёт на
          модерацию.
        </p>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <div
              key={s.title}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : done
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="whitespace-nowrap">{s.title}</span>
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          {step === 0 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label>Тип жилья</Label>
                <Select value="rooms" onValueChange={() => {}} disabled>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Номера / спальные места" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rooms">
                      Номера / спальные места
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Подтип</Label>
                <Select
                  value={subtype || undefined}
                  onValueChange={(value) => setSubtype(value ?? "")}
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например, Гостиница «Уют»"
                />
              </div>

              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Кратко расскажите о жилье"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Город</Label>
                  <CityAutocomplete
                    value={city}
                    onChange={setCity}
                    placeholder="Севастополь"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Адрес</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="ул. Морская, 1"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex flex-1 gap-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="URL изображения"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addImageUrl();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addImageUrl}
                    className="shrink-0"
                  >
                    Добавить
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">
                    {uploading ? "Загрузка..." : "Загрузить с компьютера"}
                  </span>
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {images.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <ImageIcon className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-muted-foreground">
                    Фотографии пока не добавлены
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((url) => (
                    <div
                      key={url}
                      className="group relative aspect-square overflow-hidden rounded-xl border"
                    >
                      {isImageUrl(url) ? (
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        type="button"
                        aria-label="Удалить фото"
                        onClick={() => removeImageUrl(url)}
                        className="absolute right-1.5 top-1.5 rounded-full bg-background/90 p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Максимум 30 фотографий. Можно загрузить с компьютера или указать
                URL.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <Label>Номера / спальные места</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRoom}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Добавить номер
                </Button>
              </div>

              <div className="space-y-3">
                {rooms.map((room, index) => (
                  <div
                    key={room.id}
                    className="rounded-xl border p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Номер {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Удалить номер"
                        onClick={() => removeRoom(room.id)}
                        disabled={rooms.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Название номера</Label>
                      <Input
                        value={room.name}
                        onChange={(e) =>
                          updateRoom(room.id, { name: e.target.value })
                        }
                        placeholder="Например, Стандарт"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Вместимость, гостей</Label>
                        <Input
                          type="number"
                          min={1}
                          value={room.capacity}
                          onChange={(e) =>
                            updateRoom(room.id, { capacity: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Цена, ₽/сутки</Label>
                        <Input
                          type="number"
                          min={0}
                          value={room.price}
                          onChange={(e) =>
                            updateRoom(room.id, { price: e.target.value })
                          }
                          placeholder="3500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {subtypes.length > 0 && (
                  <Badge variant="secondary">
                    Подтип:{" "}
                    {getListingSubtypesForType("rooms").find(
                      (s) => s.value === subtype
                    )?.label ?? subtype}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <Label>Что входит в питание</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMeals((prev) => [...prev, ""])}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Добавить пункт
                </Button>
              </div>

              <div className="space-y-2">
                {meals.map((meal, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={meal}
                      onChange={(e) => updateMeal(index, e.target.value)}
                      placeholder="Например, Завтрак"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Удалить пункт питания"
                      onClick={() => removeMeal(index)}
                      disabled={meals.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {meals.filter((m) => m.trim()).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Если питание не входит в стоимость, оставьте поле пустым.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(s - 1, 0))}
            >
              <ChevronLeft className="mr-1.5 h-4 w-4" />
              Назад
            </Button>

            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Далее
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={saving}>
                <Send className="mr-1.5 h-4 w-4" />
                {saving ? "Отправка..." : "Отправить на модерацию"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
