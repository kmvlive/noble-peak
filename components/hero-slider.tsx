"use client";

import { useState, useEffect } from "react";
import type { SliderImage } from "@/lib/models";

interface HeroSliderProps {
  children: React.ReactNode;
}

export function HeroSlider({ children }: HeroSliderProps) {
  const [images, setImages] = useState<SliderImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch("/api/admin/slider")
      .then((res) => res.json())
      .then((data) => {
        const valid = (data as SliderImage[]).filter(
          (img) => img.imageUrl && img.imageUrl.length > 0
        );
        setImages(valid);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className="relative overflow-hidden px-4 py-12 sm:py-16 min-h-[60vh]">
      {images.length > 0 && (
        <>
          <div className="absolute inset-0 bg-gray-900" style={{ zIndex: 0 }} />
          {images.map((img, index) => (
            <img
              key={img.id}
              src={img.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-contain transition-opacity duration-1000"
              style={{
                opacity: index === currentIndex ? 1 : 0,
                zIndex: 0,
              }}
            />
          ))}
          <div className="absolute inset-0 bg-black/30" style={{ zIndex: 1 }} />
        </>
      )}
      <div className="relative mx-auto max-w-5xl space-y-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 z-10">
        {children}
      </div>
      {images.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 z-10"
          style={{ zIndex: 10 }}
        >
          {images.map((_, index) => (
            <button
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-white" : "bg-white/50"
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
