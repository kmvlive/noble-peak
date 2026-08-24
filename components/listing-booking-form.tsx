"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ListingBookingFormProps {
  listingId: string;
  listingTitle: string;
  pricePerNight: number;
}

function computeNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const inTime = new Date(checkIn + "T00:00:00Z").getTime();
  const outTime = new Date(checkOut + "T00:00:00Z").getTime();
  const diff = Math.round((outTime - inTime) / 86400000);
  return diff > 0 ? diff : 0;
}

export function ListingBookingForm({
  listingId,
  listingTitle,
  pricePerNight,
}: ListingBookingFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nights = useMemo(
    () => computeNights(checkIn, checkOut),
    [checkIn, checkOut]
  );
  const total = nights * pricePerNight;

  const minCheckOut = checkIn
    ? new Date(new Date(checkIn + "T00:00:00Z").getTime() + 86400000)
        .toISOString()
        .split("T")[0]
    : "";

  const handleSubmit = async () => {
    if (!checkIn || !checkOut) {
      toast.error("Укажите даты заезда и выезда");
      return;
    }
    if (nights < 1) {
      toast.error("Дата выезда должна быть позже даты заезда");
      return;
    }
    if (!clientName.trim() || !clientPhone.trim()) {
      toast.error("Укажите имя и телефон");
      return;
    }

    setSubmitting(true);
    const loadingId = toast.loading("Бронируем жильё...");
    try {
      const res = await fetch("/api/listings/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          listingTitle,
          unitId: "__object__",
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          checkIn,
          checkOut,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Не удалось оформить бронь");
      }

      toast.success(
        `Жильё забронировано${data.booking?.listingNumber ? `, объект №${data.booking.listingNumber}` : ""}: ${nights} ноч. на ${data.price.toLocaleString("ru-RU")} ₽`,
        { id: loadingId }
      );
      setCheckIn("");
      setCheckOut("");
    } catch (err) {
      toast.error((err as Error).message, { id: loadingId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="check-in">Заезд</Label>
          <Input
            id="check-in"
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (checkOut && e.target.value && checkOut <= e.target.value) {
                setCheckOut("");
              }
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="check-out">Выезд</Label>
          <Input
            id="check-out"
            type="date"
            min={minCheckOut}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
        </div>
      </div>

      {nights > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
          <span>
            {nights} ноч. × {pricePerNight.toLocaleString("ru-RU")} ₽
          </span>
          <span className="font-semibold">
            {total.toLocaleString("ru-RU")} ₽
          </span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="booking-name">Имя</Label>
        <Input
          id="booking-name"
          placeholder="Как к вам обращаться"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="booking-phone">Телефон</Label>
        <Input
          id="booking-phone"
          placeholder="+7 (900) 000-00-00"
          inputMode="tel"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
        />
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CalendarCheck className="h-4 w-4" />
        )}
        Забронировать
      </Button>
      <p className="text-xs text-muted-foreground">
        Стоимость считается по количеству ночей между заездом и выездом. Занятые
        даты автоматически блокируются.
      </p>
    </div>
  );
}
