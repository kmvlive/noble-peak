"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getToken } from "./admin-layout-client";
import { WysiwygEditor } from "./wysiwyg-editor";
import { sections } from "@/lib/data";
import type { OrderType } from "@/lib/models";
import { AdminActivityCalendar } from "./admin-activity-calendar";
import { slugify } from "@/lib/utils";

interface AdminActivityFormProps {
  activity?: {
    id: string;
    title: string;
    shortDescription: string;
    description: string;
    images: string[];
    section: string;
    price: number;
    likes: number;
    isPopular: boolean;
    over18: boolean;
    orderType: OrderType;
    imageGradient: string;
    location?: string;
  };
}

const gradientOptions = [
  "from-emerald-400 to-cyan-500",
  "from-blue-400 to-indigo-500",
  "from-orange-400 to-rose-500",
  "from-amber-500 to-yellow-400",
  "from-cyan-400 to-teal-500",
  "from-stone-400 to-zinc-500",
  "from-purple-400 to-violet-500",
  "from-sky-400 to-blue-600",
  "from-red-400 to-pink-500",
  "from-orange-400 to-red-500",
];

export function AdminActivityForm({ activity }: AdminActivityFormProps) {
  const router = useRouter();
  const isEditing = !!activity;

  const [title, setTitle] = useState(activity?.title ?? "");
  const [shortDescription, setShortDescription] = useState(
    activity?.shortDescription ?? ""
  );
  const [description, setDescription] = useState(activity?.description ?? "");
  const [section, setSection] = useState(
    activity?.section ?? sections[0]?.category ?? ""
  );
  const [price, setPrice] = useState(String(activity?.price ?? ""));
  const [orderType, setOrderType] = useState<OrderType>(
    activity?.orderType ?? "order_form"
  );
  const [likes, setLikes] = useState(String(activity?.likes ?? 0));
  const [isPopular, setIsPopular] = useState(activity?.isPopular ?? false);
  const [imageGradient, setImageGradient] = useState(
    activity?.imageGradient ?? gradientOptions[0]
  );
  const [imageUrls, setImageUrls] = useState<string[]>(activity?.images ?? []);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [over18, setOver18] = useState(activity?.over18 ?? false);
  const [location, setLocation] = useState(activity?.location ?? "");

  const [id, setId] = useState(activity?.id ?? "");

  const generateSlug = (val: string) => {
    if (!isEditing) setId(slugify(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Название обязательно");
      return;
    }
    if (!isEditing && !id.trim()) {
      toast.error("ID обязателен");
      return;
    }
    if (!price || Number(price) < 0) {
      toast.error("Некорректная цена");
      return;
    }

    setSaving(true);

    const token = getToken();
    const payload = {
      ...(isEditing ? {} : { id: id.trim() }),
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      description,
      images: imageUrls,
      section,
      price: Number(price),
      likes: Number(likes),
      isPopular,
      over18,
      orderType,
      imageGradient,
      location: location.trim(),
    };

    try {
      const url = isEditing
        ? `/api/admin/activities/${activity.id}`
        : "/api/admin/activities";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Ошибка сохранения");
        return;
      }

      toast.success(isEditing ? "Активность обновлена" : "Активность создана");
      router.push("/admin");
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const addImageUrl = () => {
    if (!newImageUrl.trim()) return;
    if (imageUrls.includes(newImageUrl.trim())) return;
    setImageUrls((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
  };

  const removeImageUrl = (url: string) => {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditing ? "Редактировать активность" : "Создать активность"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!isEditing && (
          <div className="space-y-2">
            <label htmlFor="id" className="text-sm font-medium">
              ID (часть URL)
            </label>
            <Input
              id="id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              onBlur={() => {
                if (!id.trim() && title.trim()) {
                  generateSlug(title);
                }
              }}
              placeholder="gornyj-pohod"
            />
            <p className="text-xs text-muted-foreground">
              Будет использован в URL: /activities/{id || "..."}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Название
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!isEditing) generateSlug(e.target.value);
            }}
            placeholder="Горный поход на Ай-Петри"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="shortDescription" className="text-sm font-medium">
            Краткое описание
          </label>
          <Input
            id="shortDescription"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Однодневный треккинг по живописным тропам"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Полное описание</label>
          <WysiwygEditor value={description} onChange={setDescription} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Изображения</label>
          <div className="flex gap-2">
            <Input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="URL изображения или CSS-градиент"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addImageUrl();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addImageUrl}>
              Добавить
            </Button>
          </div>
          {imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {imageUrls.map((url) => (
                <span
                  key={url}
                  className="inline-flex items-center gap-1 rounded-md border bg-muted/30 px-2 py-1 text-xs"
                >
                  <span
                    className={`inline-block h-4 w-4 rounded bg-gradient-to-br ${
                      url.includes("from-") ? url : "from-gray-300 to-gray-400"
                    }`}
                  />
                  {url.length > 30 ? url.slice(0, 30) + "..." : url}
                  <button
                    type="button"
                    onClick={() => removeImageUrl(url)}
                    className="ml-0.5 text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Можно указать CSS-градиенты (например, &quot;from-blue-400
            to-indigo-500&quot;) или URL изображений
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="location" className="text-sm font-medium">
            Город / место
          </label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="г. Ялта, ул. Кирова, 15"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="section" className="text-sm font-medium">
              Раздел
            </label>
            <select
              id="section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {sections.map((s) => (
                <option key={s.category} value={s.category}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="price" className="text-sm font-medium">
              Цена (₽)
            </label>
            <Input
              id="price"
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="3500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="likes" className="text-sm font-medium">
              Лайки
            </label>
            <Input
              id="likes"
              type="number"
              min="0"
              value={likes}
              onChange={(e) => setLikes(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="gradient" className="text-sm font-medium">
              Градиент карточки
            </label>
            <select
              id="gradient"
              value={imageGradient}
              onChange={(e) => setImageGradient(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {gradientOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <div
              className={`mt-1 h-8 w-full rounded-md bg-gradient-to-br ${imageGradient}`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Тип заказа</p>
            <p className="text-xs text-muted-foreground">
              {orderType === "payment"
                ? "Оплата — клиент переходит на страницу оплаты"
                : "Форма заказа — клиент заполняет форму бронирования"}
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={orderType === "payment"}
              onChange={() =>
                setOrderType(orderType === "payment" ? "order_form" : "payment")
              }
            />
            <div className="peer h-6 w-11 rounded-full border bg-input after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:bg-background after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2" />
            <span className="ml-3 text-sm font-medium">
              {orderType === "payment" ? "Оплата" : "Форма заказа"}
            </span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPopular"
            checked={isPopular}
            onChange={(e) => setIsPopular(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="isPopular" className="text-sm font-medium">
            Популярная активность
          </label>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="over18"
            checked={over18}
            onChange={(e) => setOver18(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="over18" className="text-sm font-medium">
            18+
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            <Save className="mr-1.5 h-4 w-4" />
            {saving
              ? "Сохранение..."
              : isEditing
                ? "Сохранить изменения"
                : "Создать активность"}
          </Button>
          <Link href="/admin">
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </Link>
        </div>
      </form>

      {isEditing && activity && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold tracking-tight">
                Календарь доступных дат
              </h2>
            </div>
            <AdminActivityCalendar activityId={activity.id} />
          </div>
        </>
      )}
    </div>
  );
}
