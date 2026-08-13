"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  Compass,
  MapPin,
  CalendarDays,
  Map,
  User,
  CalendarRange,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Activity } from "@/lib/data";
import { ActivityBookingCalendar } from "@/components/activity-booking-calendar";
import { BookingForm } from "@/components/booking-form";
import { AgeVerificationOverlay } from "@/components/age-verification-overlay";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { ActivityReviews } from "@/components/activity-reviews";

export function ActivityPageContent({ activity }: { activity: Activity }) {
  const router = useRouter();
  const [likes, setLikes] = useState(activity.likes);
  const [liked, setLiked] = useState(false);
  const [clientChecked, setClientChecked] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientData, setClientData] = useState<{
    name: string;
    phone: string;
  } | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isPartner, setIsPartner] = useState(false);

  const isImageUrl = (url: string) => {
    return url.startsWith("http") || url.startsWith("/uploads/");
  };

  const currentSrc = activity.images[currentImage];
  const isRealImage = currentSrc && isImageUrl(currentSrc);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch("/api/client/me");
        if (res.ok) {
          const data = await res.json();
          setClientData(data.client || null);
        }
      } catch {
        /* not logged in */
      } finally {
        setClientChecked(true);
      }
    };
    const checkPartner = () => {
      setIsPartner(Boolean(localStorage.getItem("partner_token")));
    };
    fetchClient();
    checkPartner();
    window.addEventListener("storage", checkPartner);
    return () => window.removeEventListener("storage", checkPartner);
  }, []);

  const handleLike = () => {
    if (clientChecked && !clientData) {
      toast("Чтобы поставить лайк, зарегистрируйтесь или войдите", {
        action: {
          label: "Зарегистрироваться",
          onClick: () => router.push("/client/login"),
        },
        cancel: { label: "Отмена", onClick: () => {} },
      });
      return;
    }
    if (liked) {
      setLikes((l) => l - 1);
    } else {
      setLikes((l) => l + 1);
    }
    setLiked((l) => !l);
  };

  const handleCalendarSelect = (date: string, time?: string) => {
    if (!date) {
      setSelectedDate(null);
      setSelectedTime(null);
      return;
    }
    setSelectedDate(date);
    setSelectedTime(time ?? null);
  };

  const hasSelection = selectedDate !== null;
  const showBookingForm = hasSelection && activity.orderType === "order_form";
  const showPaymentRedirect = hasSelection && activity.orderType === "payment";

  return (
    <div className="mx-auto max-w-3xl">
      {activity.over18 && <AgeVerificationOverlay />}

      <div className="relative">
        {activity.images.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrentImage((i) =>
                  i > 0 ? i - 1 : activity.images.length - 1
                )
              }
              className="absolute left-2 sm:left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/70 p-2 sm:p-2.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-background/90"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              onClick={() =>
                setCurrentImage((i) =>
                  i < activity.images.length - 1 ? i + 1 : 0
                )
              }
              className="absolute right-2 sm:right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/70 p-2 sm:p-2.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-background/90"
              aria-label="Следующее фото"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </>
        )}
        {isRealImage ? (
          <div className="flex h-64 sm:h-80 items-center justify-center overflow-hidden bg-muted">
            <img
              src={currentSrc}
              alt={activity.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div
            className={`flex h-64 sm:h-80 items-center justify-center bg-gradient-to-br ${currentSrc}`}
          >
            <Compass className="h-16 w-16 text-white/60" />
          </div>
        )}
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

      {activity.images.filter((src) => isImageUrl(src)).length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-2 sm:px-6">
          {activity.images.map((src, i) =>
            isImageUrl(src) ? (
              <button
                key={i}
                onClick={() => {
                  setLightboxIndex(i);
                  setLightboxOpen(true);
                }}
                className="shrink-0 overflow-hidden rounded-md ring-offset-background transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <img
                  src={src}
                  alt={`Фото ${i + 1}`}
                  className="h-14 w-14 object-cover sm:h-20 sm:w-20"
                />
              </button>
            ) : null
          )}
        </div>
      )}

      <div className="space-y-6 px-4 py-6 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <MapPin className="mr-0.5 h-3 w-3" />
                {activity.category}
              </Badge>
              {activity.isMultiDay && (
                <Badge
                  variant="outline"
                  className="gap-1 border-primary/30 text-primary"
                >
                  <CalendarRange className="h-3 w-3" />
                  Многодневная
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight break-words sm:text-3xl">
              {activity.title}
            </h1>
            {activity.location && (
              <Link
                href={`/locations/${encodeURIComponent(activity.location)}`}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Map className="h-4 w-4 shrink-0" />
                <span className="truncate">{activity.location}</span>
              </Link>
            )}
            {activity.partnerEmail && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="h-4 w-4 shrink-0" />
                <Link
                  href={`/partners/${encodeURIComponent(activity.partnerSlug || activity.partnerEmail)}`}
                  className="text-primary hover:underline"
                >
                  Страница партнёра
                </Link>
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl font-bold text-primary sm:text-2xl">
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
            className="gap-2 min-h-[48px]"
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
            {likes}
          </Button>
        </div>

        <div
          className="prose prose-sm sm:prose-base max-w-none overflow-x-auto break-words prose-headings:text-foreground prose-a:text-primary prose-ul:space-y-1"
          dangerouslySetInnerHTML={{ __html: activity.description }}
        />

        <div className="pt-4">
          <Separator className="mb-4" />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold tracking-tight">
                Выберите дату
              </h2>
            </div>
            <ActivityBookingCalendar
              activityId={activity.id}
              onSelect={handleCalendarSelect}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
            />
          </div>
        </div>

        {isPartner ? (
          <div className="flex items-start gap-3 rounded-lg border border-muted bg-muted/40 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Бронирование доступно только клиентам
              </p>
              <p className="text-sm text-muted-foreground">
                Вы вошли как партнёр. Чтобы купить или забронировать активность,
                войдите как клиент.
              </p>
            </div>
          </div>
        ) : (
          <>
            {showBookingForm && (
              <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <BookingForm
                  activityId={activity.id}
                  activityTitle={activity.title}
                  date={selectedDate!}
                  time={selectedTime}
                  clientName={clientData?.name ?? ""}
                  clientPhone={clientData?.phone ?? ""}
                  price={activity.price}
                />
              </div>
            )}

            {showPaymentRedirect && (
              <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Link
                  href={`/payment?activityId=${activity.id}&date=${selectedDate}&time=${selectedTime || ""}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary min-h-[48px] px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Перейти к оплате — {activity.price.toLocaleString("ru-RU")} ₽
                </Link>
              </div>
            )}
          </>
        )}

        <div className="pt-6">
          <ActivityReviews activityId={activity.id} />
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
          >
            <ChevronLeft className="h-4 w-4" />
            На главную
          </Link>
        </div>
      </div>

      {lightboxOpen && (
        <PhotoLightbox
          images={activity.images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={(index) => setLightboxIndex(index)}
        />
      )}
    </div>
  );
}
