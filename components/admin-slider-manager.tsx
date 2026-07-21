"use client";

import { useState, useEffect, useCallback } from "react";
import { ImageIcon, Trash2, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { SliderImage } from "@/lib/models";

export function AdminSliderManager() {
  const [images, setImages] = useState<SliderImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchImages = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/slider", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setImages(data);
    } catch {
      toast.error("Не удалось загрузить изображения");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/slider", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка загрузки");
      }

      toast.success("Изображение добавлено");
      await fetchImages();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(id: string) {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/slider", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Ошибка удаления");

      toast.success("Изображение удалено");
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch {
      toast.error("Не удалось удалить изображение");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Слайдер</h1>
        <div className="relative">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
            id="slider-upload"
          />
          <Button
            disabled={uploading}
            onClick={() => document.getElementById("slider-upload")?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {uploading ? "Загрузка..." : "Добавить фото"}
          </Button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ImageIcon className="h-8 w-8" />
          </div>
          <p className="text-sm">Нет изображений для слайдера</p>
          <p className="mt-1 text-xs">
            Добавьте фоновые фотографии для hero-секции
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-video overflow-hidden rounded-lg border"
            >
              <img
                src={img.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                <Button
                  variant="destructive"
                  size="icon"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => handleDelete(img.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
