"use client";

import { useEffect, useCallback } from "react";
import { XIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface PhotoLightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function PhotoLightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: PhotoLightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        onNavigate(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
      } else if (e.key === "ArrowRight") {
        onNavigate(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
      }
    },
    [currentIndex, images.length, onClose, onNavigate]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const isImageUrl = (url: string) =>
    url.startsWith("http") || url.startsWith("/uploads/");

  const currentSrc = images[currentIndex];
  const isRealImage = currentSrc && isImageUrl(currentSrc);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фото"
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
        aria-label="Закрыть"
      >
        <XIcon className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(
                currentIndex > 0 ? currentIndex - 1 : images.length - 1
              );
            }}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            aria-label="Предыдущее фото"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(
                currentIndex < images.length - 1 ? currentIndex + 1 : 0
              );
            }}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            aria-label="Следующее фото"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      <div
        className="flex max-h-[90vh] max-w-[90vw] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isRealImage ? (
          <img
            src={currentSrc}
            alt={`Фото ${currentIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        ) : (
          <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-muted text-white/60">
            <span className="text-lg">Изображение недоступно</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
