"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  LocateFixed,
  MapPin,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getListingSubtypesForType } from "@noble-peak/shared";
import type { HousingType } from "@noble-peak/shared";
import { getToken } from "./partner-layout-client";
import { CityAutocomplete } from "./city-autocomplete";
import { createPartnerListingSchema } from "@/lib/validation/listing";

const STEPS = [
  { title: "Адрес и карта", icon: MapPin },
  { title: "Основная информация", icon: Building2 },
  { title: "Фото и цена", icon: ImageIcon },
];

async function geocodeAddress(query: string): Promise<{
  lat: number;
  lon: number;
} | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      { headers: { "User-Agent": "magazin-tour/1.0" } }
    );
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return {
        lat: Number.parseFloat(data[0].lat),
        lon: Number.parseFloat(data[0].lon),
      };
    }
  } catch {
    // геокодирование недоступно
  }
  return null;
}

function osmEmbedUrl(lat: number, lon: number): string {
  const dLat = 0.01;
  const dLon = 0.015;
  const bbox = `${lon - dLon},${lat - dLat},${lon + dLon},${lat + dLat}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

interface PartnerHomeListingFormProps {
  housingType: HousingType;
  onBack?: () => void;
}

export function PartnerHomeListingForm({
  housingType,
  onBack,
}: PartnerHomeListingFormProps) {
  const router = useRouter();

  const [step, setStep] = useState(0);

  const [subtype, setSubtype] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");

  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [price, setPrice] = useState("");
  const [guests, setGuests] = useState("2");

  const [saving, setSaving] = useState(false);

  const subtypes = getListingSubtypesForType(housingType);

  const locate = async () => {
    const query = [city.trim(), address.trim()].filter(Boolean).join(", ");
    if (!query) {
      toast.error("Введите адрес и город для поиска на карте");
      return;
    }
    setLocating(true);
    try {
      const coords = await geocodeAddress(query);
      if (!coords) {
        toast.error("Не удалось определить место по адресу");
        return;
      }
      setLatitude(coords.lat);
      setLongitude(coords.lon);
      toast.success("Место определено на карте");
    } finally {
      setLocating(false);
    }
  };

  const canProceedFromStep = (): boolean => {
    if (step === 0) {
      return Boolean(address.trim() && latitude !== null && longitude !== null);
    }
    if (step === 1) {
      return Boolean(subtype && title.trim() && city.trim());
    }
    if (step === 2) {
      return Number(price) >= 0 && !Number.isNaN(Number(price));
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
    const payload = {
      housingType,
      subtype,
      title: title.trim(),
      description: description.trim(),
      city: city.trim(),
      address: address.trim(),
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      images,
      price: Number(price),
      guests: Number(guests) >= 1 ? Number(guests) : 1,
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

  const mapSrc =
    latitude !== null && longitude !== null
      ? osmEmbedUrl(latitude, longitude)
      : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Добавить объявление
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          После отправки объявление уйдёт на модерацию.
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
                <Label>Адрес</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Например, ул. Морская, 1"
                />
              </div>
              <div className="space-y-2">
                <Label>Город / населённый пункт</Label>
                <CityAutocomplete
                  value={city}
                  onChange={setCity}
                  placeholder="Севастополь"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={locate}
                disabled={locating}
                className="w-full"
              >
                <LocateFixed className="h-4 w-4 sm:mr-1.5" />
                <span>
                  {locating ? "Поиск места..." : "Точно определить на карте"}
                </span>
              </Button>

              <div className="overflow-hidden rounded-xl border">
                {mapSrc ? (
                  <>
                    <iframe
                      src={mapSrc}
                      width="100%"
                      height="280"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Карта ${address || "объекта"}`}
                    />
                    <div className="flex items-center gap-2 border-t bg-muted px-3 py-2 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {latitude !== null &&
                        longitude !== null &&
                        `Точка определена: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
                    </div>
                  </>
                ) : (
                  <div className="flex h-64 items-center justify-center bg-muted px-6 text-center text-sm text-muted-foreground">
                    Укажите адрес и нажмите «Точно определить на карте», чтобы
                    отметить точное место объекта
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
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
                  placeholder="Например, Светлая студия в центре"
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

              <div className="space-y-2">
                <Label>Город</Label>
                <CityAutocomplete
                  value={city}
                  onChange={setCity}
                  placeholder="Севастополь"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Цена, ₽/сутки</Label>
                  <Input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="3500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Число гостей</Label>
                  <Input
                    type="number"
                    min={1}
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => Math.max(s - 1, 0))}
              >
                <ChevronLeft className="mr-1.5 h-4 w-4" />
                Назад
              </Button>
            ) : onBack ? (
              <Button type="button" variant="outline" onClick={onBack}>
                <ChevronLeft className="mr-1.5 h-4 w-4" />
                Изменить тип жилья
              </Button>
            ) : (
              <span />
            )}

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
