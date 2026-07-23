"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, Upload, ImageIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getToken } from "./partner-layout-client";
import { WysiwygEditor } from "./wysiwyg-editor";
import type { SectionRecord, ActivityType } from "@/lib/models";

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

export function PartnerActivityForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [sectionOptions, setSectionOptions] = useState<SectionRecord[]>([]);
  const [section, setSection] = useState("");
  const [price, setPrice] = useState("");
  const [imageGradient, setImageGradient] = useState(gradientOptions[0]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [over18, setOver18] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("individual");
  const [location, setLocation] = useState("");

  useEffect(() => {
    fetch("/api/admin/sections")
      .then((res) => res.json())
      .then((data: SectionRecord[]) => {
        setSectionOptions(data);
        if (data.length > 0) {
          setSection(data[0].category);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Название обязательно");
      return;
    }
    if (!price || Number(price) < 0) {
      toast.error("Некорректная цена");
      return;
    }

    setSaving(true);

    const payload = {
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      description,
      images: imageUrls,
      section,
      price: Number(price),
      over18,
      activityType,
      imageGradient,
      location: location.trim(),
    };

    try {
      const token = getToken();
      const res = await fetch("/api/partner/activities", {
        method: "POST",
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

      toast.success("Активность отправлена на модерацию");
      router.push("/partner");
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 30 - imageUrls.length;
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

    if (filesToUpload.length < files.length) {
      toast.info(
        `Выбрано ${files.length}, загружено ${filesToUpload.length} (максимум 30)`
      );
    }

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Ошибка загрузки");
        return;
      }

      setImageUrls((prev) => [...prev, ...data.urls]);
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Добавить активность
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          После отправки активность будет проверена администратором.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Название
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex gap-2 flex-1">
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
                className="flex-1"
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
          {imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {imageUrls.map((url) => (
                <span
                  key={url}
                  className="inline-flex items-center gap-1 rounded-md border bg-muted/30 px-2 py-1 text-xs"
                >
                  {isImageUrl(url) ? (
                    <span className="inline-block h-8 w-8 flex-shrink-0 overflow-hidden rounded">
                      <img
                        src={url}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          target.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                      <span className="hidden">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </span>
                    </span>
                  ) : (
                    <span
                      className={`inline-block h-8 w-8 flex-shrink-0 rounded bg-gradient-to-br ${
                        url.includes("from-")
                          ? url
                          : "from-gray-300 to-gray-400"
                      }`}
                    />
                  )}
                  <span className="max-w-[120px] truncate">
                    {url.length > 25 ? url.slice(0, 25) + "..." : url}
                  </span>
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
            Максимум 30 фотографий. Можно загрузить фото с компьютера, указать
            CSS-градиенты или URL изображений
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
              {sectionOptions.length === 0 && (
                <option value="">Нет доступных разделов</option>
              )}
              {sectionOptions.map((s) => (
                <option key={s.category} value={s.category}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="price" className="text-sm font-medium">
              Цена для клиента (₽)
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

        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3 sm:p-4">
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">Тип активности</span>
          <label className="relative inline-flex cursor-pointer items-center ml-auto">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={activityType === "group"}
              onChange={() =>
                setActivityType(
                  activityType === "group" ? "individual" : "group"
                )
              }
            />
            <div className="peer h-6 w-11 rounded-full border bg-input after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:bg-background after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2" />
            <span className="ml-3 text-sm">
              {activityType === "individual" ? "Индивидуальная" : "Групповая"}
            </span>
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
            {saving ? "Отправка..." : "Отправить на модерацию"}
          </Button>
        </div>
      </form>
    </div>
  );
}
