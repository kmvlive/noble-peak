"use client";

import { useState } from "react";
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  Compass,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Activity } from "@/lib/data";

export function ActivityPageContent({ activity }: { activity: Activity }) {
  const [likes, setLikes] = useState(activity.likes);
  const [liked, setLiked] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const handleLike = () => {
    if (liked) {
      setLikes((l) => l - 1);
    } else {
      setLikes((l) => l + 1);
    }
    setLiked((l) => !l);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative">
        {activity.images.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrentImage((i) =>
                  i > 0 ? i - 1 : activity.images.length - 1
                )
              }
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/70 p-2 shadow-sm backdrop-blur-sm transition-colors hover:bg-background/90"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() =>
                setCurrentImage((i) =>
                  i < activity.images.length - 1 ? i + 1 : 0
                )
              }
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/70 p-2 shadow-sm backdrop-blur-sm transition-colors hover:bg-background/90"
              aria-label="Следующее фото"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        <div
          className={`flex h-64 sm:h-80 items-center justify-center bg-gradient-to-br ${activity.images[currentImage]}`}
        >
          <Compass className="h-16 w-16 text-white/60" />
        </div>
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {activity.images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentImage(i)}
              className={`h-2 w-2 rounded-full transition-all ${
                i === currentImage
                  ? "w-4 bg-white"
                  : "bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Фото ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-6 px-4 py-6 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <MapPin className="mr-0.5 h-3 w-3" />
                {activity.category}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {activity.title}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {activity.price.toLocaleString("ru-RU")} ₽
            </p>
            <p className="text-xs text-muted-foreground">за человека</p>
          </div>
        </div>

        <p className="text-base text-muted-foreground">
          {activity.shortDescription}
        </p>

        <div className="flex gap-3">
          <Button
            variant={liked ? "default" : "outline"}
            size="lg"
            onClick={handleLike}
            className="gap-2"
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
            {likes}
          </Button>
        </div>

        <div
          className="prose prose-sm sm:prose-base max-w-none prose-headings:text-foreground prose-a:text-primary prose-ul:space-y-1"
          dangerouslySetInnerHTML={{ __html: activity.description }}
        />

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
