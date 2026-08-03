"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Rss,
  User,
  Loader2,
  ExternalLink,
  Camera,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { WysiwygEditor } from "@/components/wysiwyg-editor";
import { toast } from "sonner";
import { getToken } from "@/components/partner-layout-client";
import Link from "next/link";

interface ProfileData {
  name: string;
  phone: string;
  email: string;
  photo: string;
  description: string;
  slug: string;
}

export function PartnerPublicProfileEditor() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [photo, setPhoto] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/partner/login");
      return;
    }

    fetch("/api/partner/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка загрузки");
        return res.json();
      })
      .then((data: ProfileData) => {
        setProfile(data);
        setPhoto(data.photo || "");
        setDescription(data.description || "");
        setSlug(data.slug || "");
      })
      .catch(() => {
        toast.error("Не удалось загрузить профиль");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    const token = getToken();
    if (!token) return;

    setSaving(true);
    const id = toast.loading("Сохраняем...");

    try {
      const res = await fetch("/api/partner/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photo, description, slug }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка сохранения");
      }

      const data = await res.json();
      setProfile(data);
      setPhoto(data.photo || "");
      setDescription(data.description || "");
      setSlug(data.slug || "");
      toast.success("Готово", { id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка сохранения", {
        id,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getToken();
    if (!token) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

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

      if (data.urls && data.urls.length > 0) {
        setPhoto(data.urls[0]);
        toast.success("Фото загружено");
      }
    } catch {
      toast.error("Ошибка загрузки фото");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Не удалось загрузить профиль
      </div>
    );
  }

  const publicProfileUrl =
    typeof window !== "undefined" && slug
      ? `${window.location.origin}/partners/${encodeURIComponent(slug)}`
      : "";

  const rssUrl =
    typeof window !== "undefined" && slug
      ? `${window.location.origin}/partners/${encodeURIComponent(slug)}/rss.xml`
      : "";

  const handleCopyRssLink = () => {
    if (rssUrl) {
      navigator.clipboard.writeText(rssUrl);
      toast.success("Ссылка скопирована");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        {photo ? (
          <img
            src={photo}
            alt="Фото профиля"
            className="h-16 w-16 rounded-full object-cover ring-2 ring-muted"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary ring-2 ring-muted">
            <User className="h-8 w-8" />
          </div>
        )}
        <div>
          <p className="font-medium">{profile.name}</p>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      {publicProfileUrl && (
        <Link
          href={publicProfileUrl}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          Открыть публичный профиль
        </Link>
      )}

      {rssUrl && (
        <div className="flex items-center gap-2 text-sm">
          <Rss className="h-4 w-4 text-orange-500 shrink-0" />
          <span className="text-muted-foreground">Ваш RSS-канал:</span>
          <a
            href={rssUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline truncate max-w-[300px]"
          >
            {rssUrl}
          </a>
          <button
            type="button"
            onClick={handleCopyRssLink}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            title="Скопировать ссылку"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="slug">Адрес страницы (slug)</Label>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            id="slug"
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            placeholder="partner-ivanov"
            className="min-w-0"
          />
        </div>
        <p className="text-xs text-muted-foreground break-all">
          Только латиница, цифры и дефисы. Адрес страницы: /partners/
          {slug || "slug"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo">Ссылка на фото профиля</Label>
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            id="photo"
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="min-w-0"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Укажите URL изображения. Рекомендуемый размер: 500x500px.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Загрузить фото с компьютера</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            Загрузить фото с компьютера
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Выберите изображение с компьютера. Допустимы JPEG, PNG, WebP, GIF до
          10 MB.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Описание профиля</Label>
        <WysiwygEditor value={description} onChange={setDescription} />
        <p className="text-xs text-muted-foreground">
          Расскажите о себе и своих услугах. Поддерживается форматирование
          текста.
        </p>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Сохранить
      </Button>
    </div>
  );
}
