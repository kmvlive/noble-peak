"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ImageIcon,
  Plus,
  Save,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getToken } from "@/components/partner-layout-client";
import { CityAutocomplete } from "./city-autocomplete";
import { createPartnerListingSchema } from "@/lib/validation/listing";
import { getListingSubtypesForType } from "@noble-peak/shared";
import type {
  ListingRecord,
  HousingType,
  ListingRoom,
  ListingChannelConnection,
} from "@noble-peak/shared";
import { ListingChannelsManager } from "./listing-channels-manager";

interface RoomDraft {
  id: string;
  name: string;
  capacity: string;
  price: string;
}

const statusConfig: Record<
  ListingRecord["status"],
  { label: string; icon: typeof Clock; class: string }
> = {
  pending: {
    label: "На модерации",
    icon: Clock,
    class: "text-amber-600 bg-amber-50 border-amber-200",
  },
  active: {
    label: "Одобрено",
    icon: CheckCircle2,
    class: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  rejected: {
    label: "Отклонено",
    icon: XCircle,
    class: "text-red-600 bg-red-50 border-red-200",
  },
};

function toRoomDraft(room: ListingRoom): RoomDraft {
  return {
    id: crypto.randomUUID(),
    name: room.name ?? "",
    capacity: String(room.capacity),
    price: String(room.price),
  };
}

export function PartnerListingEditForm({ listingId }: { listingId: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [status, setStatus] = useState<ListingRecord["status"]>("pending");
  const [housingType, setHousingType] = useState<HousingType | null>(null);

  const [subtype, setSubtype] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [price, setPrice] = useState("");
  const [guests, setGuests] = useState("1");

  const [rooms, setRooms] = useState<RoomDraft[]>([]);
  const [meals, setMeals] = useState<string[]>([""]);
  const [channelConnections, setChannelConnections] = useState<
    ListingChannelConnection[]
  >([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/partner/login");
      return;
    }

    fetch(`/api/partner/listings/${listingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!res.ok) throw new Error("Ошибка загрузки объявления");
        return res.json();
      })
      .then((data: ListingRecord | null) => {
        if (!data) {
          setLoading(false);
          return;
        }
        setStatus(data.status);
        setHousingType(data.housingType);
        setSubtype(data.subtype);
        setTitle(data.title);
        setDescription(data.description ?? "");
        setCity(data.city);
        setAddress(data.address ?? "");
        setImages(data.images ?? []);
        setPrice(data.price != null ? String(data.price) : "");
        setGuests(
          data.guests != null && data.guests >= 1 ? String(data.guests) : "1"
        );
        setRooms((data.rooms ?? []).map(toRoomDraft));
        setMeals(
          data.meals && data.meals.length > 0 ? [...data.meals, ""] : [""]
        );
        setChannelConnections(data.channelConnections ?? []);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.message || "Ошибка загрузки объявления");
        setLoading(false);
      });
  }, [listingId, router]);

  const subtypes = housingType ? getListingSubtypesForType(housingType) : [];
  const isRooms = housingType === "rooms";

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
    for (const file of Array.from(files).slice(0, remaining)) {
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

  const updateRoom = (id: string, patch: Partial<RoomDraft>) => {
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRoom = () =>
    setRooms((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", capacity: "2", price: "" },
    ]);

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

  const handleSubmit = async () => {
    if (!housingType) return;

    let payload: Record<string, unknown>;

    if (isRooms) {
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
      payload = {
        housingType,
        subtype,
        title: title.trim(),
        description: description.trim(),
        city: city.trim(),
        address: address.trim() || undefined,
        images,
        rooms: normalizedRooms,
        meals: meals.map((m) => m.trim()).filter((m) => m.length > 0),
        channelConnections,
      };
    } else {
      payload = {
        housingType,
        subtype,
        title: title.trim(),
        description: description.trim(),
        city: city.trim(),
        address: address.trim() || undefined,
        images,
        price: Number(price),
        guests: Number(guests) >= 1 ? Number(guests) : 1,
        channelConnections,
      };
    }

    const parsed = createPartnerListingSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error("Некорректные данные формы");
      return;
    }

    setSaving(true);
    const id = toast.loading("Сохраняем изменения...");

    try {
      const token = getToken();
      const res = await fetch(`/api/partner/listings/${listingId}`, {
        method: "PUT",
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

      toast.success("Изменения сохранены", { id });
      router.push("/partner/listings");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ошибка сохранения",
        { id }
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (notFound || !housingType) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-10 text-center">
        <h1 className="text-xl font-bold">Объявление не найдено</h1>
        <p className="text-sm text-muted-foreground">
          Возможно, оно было удалено или не принадлежит вашему аккаунту.
        </p>
        <Link href="/partner/listings">
          <Button variant="outline">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Вернуться к «Мои объявления»
          </Button>
        </Link>
      </div>
    );
  }

  const cfg = statusConfig[status] || statusConfig.pending;
  const StatusIcon = cfg.icon;

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/partner/listings"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Мои объявления
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Редактировать объявление
          </h1>
          <span
            className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.class}`}
          >
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </span>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label>Тип жилья</Label>
            <Select
              value={housingType}
              onValueChange={(value) => {
                const type = value as HousingType;
                setHousingType(type);
                setSubtype("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Тип жилья" />
              </SelectTrigger>
              <SelectContent>
                {(
                  [
                    "rooms",
                    "apartments",
                    "houses",
                    "separate_rooms",
                  ] as HousingType[]
                ).map((type) => (
                  <SelectItem key={type} value={type}>
                    {
                      {
                        rooms: "Номера / спальные места",
                        apartments: "Квартиры / апартаменты целиком",
                        houses: "Дома / коттеджи целиком",
                        separate_rooms: "Отдельные комнаты",
                      }[type]
                    }
                  </SelectItem>
                ))}
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
              <CityAutocomplete value={city} onChange={setCity} />
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

          {!isRooms && (
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
          )}

          <div className="space-y-4">
            <Label>Фотографии</Label>
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
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-10 text-center">
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
          </div>

          {isRooms && (
            <>
              <div className="space-y-4">
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
                              updateRoom(room.id, {
                                capacity: e.target.value,
                              })
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
              </div>

              <div className="space-y-4">
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
              </div>
            </>
          )}

          <div className="rounded-xl border p-4">
            <ListingChannelsManager
              initialConnections={channelConnections}
              onChange={setChannelConnections}
              listingId={listingId}
            />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <Link href="/partner/listings">
              <Button variant="outline" type="button">
                Отмена
              </Button>
            </Link>
            <Button type="button" onClick={handleSubmit} disabled={saving}>
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? "Сохраняем..." : "Сохранить изменения"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
