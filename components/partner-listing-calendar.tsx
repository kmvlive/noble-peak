"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Lock,
  Save,
  BookMarked,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getToken } from "@/components/partner-layout-client";
import { getListingSubtypeLabel } from "@noble-peak/shared";
import type {
  ListingRecord,
  ListingCalendarRecord,
  ListingBookingRecord,
  ListingDateStatus,
} from "@noble-peak/shared";

interface PartnerListingCalendarProps {
  listingId: string;
}

const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function getMonthDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (number | null)[] = [];
  const startOffset = (firstDay.getDay() + 6) % 7;
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  return days;
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isTodayOrFuture(dateStr: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dateStr >= today;
}

function listingNightDates(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const cur = new Date(checkIn + "T00:00:00Z");
  const end = new Date(checkOut + "T00:00:00Z");
  while (cur < end) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

export function PartnerListingCalendar({
  listingId,
}: PartnerListingCalendarProps) {
  const [listing, setListing] = useState<ListingRecord | null>(null);
  const [units, setUnits] = useState<string[]>([]);
  const [calendars, setCalendars] = useState<ListingCalendarRecord[]>([]);
  const [bookings, setBookings] = useState<ListingBookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [unitId, setUnitId] = useState<string>("");
  const [dates, setDates] = useState<Record<string, ListingDateStatus>>({});
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [minNights, setMinNights] = useState<string>("");

  const [closeMode, setCloseMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState<string>("");
  const [lastClickedDate, setLastClickedDate] = useState<string | null>(null);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`/api/partner/listings/${listingId}/calendar`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка загрузки календаря");
        return res.json();
      })
      .then((data) => {
        setListing(data.listing);
        setUnits(Array.isArray(data.units) ? data.units : []);
        setCalendars(Array.isArray(data.calendars) ? data.calendars : []);
        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
        if (Array.isArray(data.units) && data.units.length > 0) {
          setUnitId(data.units[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.message);
        setLoading(false);
      });
  }, [listingId]);

  useEffect(() => {
    if (!unitId) return;
    const cal = calendars.find((c) => c.unitId === unitId) as
      ListingCalendarRecord | undefined;
    setDates(cal?.dates ?? {});
    setPrices(cal?.prices ?? {});
    setMinNights(cal?.minNights ? String(cal.minNights) : "");
    setSelectedDate(null);
    setPriceInput("");
  }, [unitId, calendars]);

  const bookedDates = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookings) {
      if (b.unitId !== unitId || b.status !== "confirmed") continue;
      for (const d of listingNightDates(b.checkIn, b.checkOut)) {
        set.add(d);
      }
    }
    return set;
  }, [bookings, unitId]);

  const unitPrice = useMemo(() => {
    if (!listing) return 0;
    if (listing.housingType === "rooms") {
      const room = (listing.rooms ?? []).find(
        (r) => (r.id ?? r.name ?? "") === unitId
      );
      if (room && room.price > 0) return room.price;
    }
    return listing.price;
  }, [listing, unitId]);

  const buildRange = (start: string, end: string): string[] => {
    const [rangeStart, rangeEnd] = [start, end].sort();
    const range: string[] = [];
    const current = new Date(rangeStart + "T00:00:00Z");
    const endDate = new Date(rangeEnd + "T00:00:00Z");
    while (current <= endDate) {
      const dateStr = current.toISOString().split("T")[0];
      if (isTodayOrFuture(dateStr)) range.push(dateStr);
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return range;
  };

  const warnIfBooked = useCallback(
    (range: string[]) => {
      const booked = range.filter((d) => bookedDates.has(d));
      if (booked.length > 0) {
        toast.warning(
          `Внимание: на даты ${booked.join(", ")} есть подтверждённые брони. Существующие брони не будут отменены, но новые оформить нельзя.`,
          { duration: 8000 }
        );
      }
    },
    [bookedDates]
  );

  const closeRange = useCallback(
    (range: string[]) => {
      warnIfBooked(range);
      setDates((prev) => {
        const next = { ...prev };
        for (const d of range) {
          if (bookedDates.has(d)) continue;
          next[d] = "closed";
        }
        return next;
      });
    },
    [bookedDates, warnIfBooked]
  );

  const openRange = useCallback((range: string[]) => {
    setDates((prev) => {
      const next = { ...prev };
      for (const d of range) {
        if (next[d] === "closed") delete next[d];
      }
      return next;
    });
  }, []);

  const handleDateClick = (
    dateStr: string,
    _day: number,
    e: React.MouseEvent
  ) => {
    if (!isTodayOrFuture(dateStr)) return;
    if (bookedDates.has(dateStr)) return;

    if (closeMode) {
      if (e.shiftKey && lastClickedDate && lastClickedDate !== dateStr) {
        closeRange(buildRange(lastClickedDate, dateStr));
        return;
      }
      setLastClickedDate(dateStr);
      if (dates[dateStr] === "closed") {
        openRange([dateStr]);
      } else {
        closeRange([dateStr]);
      }
      return;
    }

    setLastClickedDate(dateStr);
    if (selectedDate === dateStr) {
      setSelectedDate(null);
      setPriceInput("");
      return;
    }
    setSelectedDate(dateStr);
    setPriceInput(prices[dateStr] ? String(prices[dateStr]) : "");
  };

  const applyPrice = () => {
    if (!selectedDate) return;
    const value = priceInput.trim();
    if (value === "") {
      setPrices((prev) => {
        const next = { ...prev };
        delete next[selectedDate];
        return next;
      });
      toast.success("Цена на дату сброшена (используется базовая)");
      return;
    }
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      toast.error("Введите положительную цену за сутки");
      return;
    }
    setPrices((prev) => ({ ...prev, [selectedDate]: Math.round(num) }));
    toast.success("Цена на дату сохранена");
  };

  const handleSave = async () => {
    setSaving(true);
    const token = getToken();
    const min = minNights.trim() === "" ? null : Number(minNights);
    try {
      const res = await fetch(`/api/partner/listings/${listingId}/calendar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          unitId,
          dates,
          prices,
          minNights: min,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Ошибка сохранения");
      }
      setCalendars((prev) => {
        const rest = prev.filter((c) => c.unitId !== unitId);
        return [...rest, data];
      });
      toast.success("Календарь сохранён");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDate(null);
    setPriceInput("");
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDate(null);
    setPriceInput("");
  };

  const goToToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDate(null);
    setPriceInput("");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        Объявление не найдено
      </div>
    );
  }

  const monthDays = getMonthDays(year, month);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/partner/listings">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="font-semibold leading-tight">{listing.title}</h2>
            <p className="text-xs text-muted-foreground">
              {getListingSubtypeLabel(listing.housingType, listing.subtype)}
              {listing.city ? ` · ${listing.city}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {units.length > 1 && (
            <Select value={unitId} onValueChange={(v) => setUnitId(v ?? "")}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Номер" />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u === "__object__" ? "Объект целиком" : u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[150px] text-center text-sm font-medium">
            {MONTHS[month]} {year}
          </span>
          <Button variant="outline" size="icon-sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Сегодня
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={closeMode ? "outline" : "default"}
            size="sm"
            onClick={() => {
              setCloseMode(false);
              setSelectedDate(null);
              setPriceInput("");
            }}
          >
            Даты и цены
          </Button>
          <Button
            variant={closeMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setCloseMode(true);
              setSelectedDate(null);
              setPriceInput("");
            }}
          >
            <Lock className="mr-1.5 h-4 w-4" />
            Закрыть дни
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px rounded-lg border bg-muted overflow-hidden">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="bg-muted/50 px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {name}
          </div>
        ))}
        {monthDays.map((day, i) => {
          if (day === null)
            return <div key={`empty-${i}`} className="bg-background p-2" />;

          const dateStr = formatDate(year, month, day);
          const isPast = !isTodayOrFuture(dateStr);
          const isBooked = bookedDates.has(dateStr);
          const isClosed = dates[dateStr] === "closed";
          const isSelected = selectedDate === dateStr;
          const hasPrice = prices[dateStr] !== undefined;

          let cellClass = "text-foreground";
          let icon = null;
          if (isPast) {
            cellClass = "text-muted-foreground";
          } else if (isBooked) {
            cellClass = "bg-violet-100 text-violet-700 font-medium";
            icon = <BookMarked className="h-2.5 w-2.5" />;
          } else if (isClosed) {
            cellClass = "bg-destructive/10 text-destructive font-medium";
            icon = <Lock className="h-2.5 w-2.5" />;
          } else if (hasPrice) {
            cellClass = "bg-emerald-100 text-emerald-700 font-medium";
          }

          return (
            <button
              key={dateStr}
              type="button"
              onClick={(e) => handleDateClick(dateStr, day, e)}
              disabled={isPast || (closeMode && isBooked)}
              className={`relative bg-background p-2 text-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                isPast
                  ? "cursor-not-allowed opacity-40"
                  : closeMode && isBooked
                    ? "cursor-not-allowed"
                    : "hover:bg-accent/50"
              } ${isSelected ? "ring-2 ring-primary ring-inset" : ""}`}
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs ${cellClass}`}
              >
                {day}
              </span>
              {!isPast && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
                  {icon}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border bg-background" />
          Свободно
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-emerald-100" />
          Задана цена
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-destructive" />
          Закрыто
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BookMarked className="h-3 w-3 text-violet-600" />
          Занято (бронь)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-muted opacity-40" />
          Прошедшие
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        {closeMode
          ? "Режим «Закрыть дни»: клик по свободной дате — закрыть от новых броней, повторный клик — открыть. Shift+клик — закрыть диапазон. Занятые (забронированные) даты менять нельзя."
          : "Клик по дате — задать цену за сутки или закрыть/открыть конкретный день. Базовая цена — " +
            unitPrice.toLocaleString("ru-RU") +
            " ₽."}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="text-sm font-semibold">Минимальный срок пребывания</h3>
          <p className="text-xs text-muted-foreground">
            Минимальное количество ночей для одной брони на этом{" "}
            {units.length > 1 ? "номере" : "объекте"}.
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={365}
              value={minNights}
              onChange={(e) => setMinNights(e.target.value)}
              placeholder="Ноч., например 2"
              className="w-40"
            />
            <span className="text-xs text-muted-foreground">ноч.</span>
          </div>
        </div>

        {selectedDate && (
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Настройка даты {selectedDate}
              </h3>
              <div className="flex items-center gap-1">
                {!bookedDates.has(selectedDate) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (dates[selectedDate] === "closed") {
                        openRange([selectedDate]);
                      } else {
                        closeRange([selectedDate]);
                      }
                    }}
                  >
                    {dates[selectedDate] === "closed" ? "Открыть" : "Закрыть"}
                  </Button>
                )}
              </div>
            </div>
            {bookedDates.has(selectedDate) ? (
              <p className="text-xs text-muted-foreground">
                Дата занята подтверждённой бронью. Изменить доступность нельзя,
                но можно задать цену для будущих расчётов.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Текущий статус:{" "}
                {dates[selectedDate] === "closed"
                  ? "закрыто владельцем"
                  : "свободно"}
              </p>
            )}
            <div className="flex items-end gap-2">
              <div className="space-y-1.5 flex-1">
                <Label htmlFor={`price-${selectedDate}`}>
                  Цена за сутки, ₽
                </Label>
                <Input
                  id={`price-${selectedDate}`}
                  type="number"
                  min={1}
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder={String(unitPrice)}
                />
              </div>
              <Button variant="secondary" onClick={applyPrice}>
                Применить
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Оставьте поле пустым и нажмите «Применить», чтобы использовать
              базовую цену.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-lg border p-3">
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
          <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
          Брони на этом {units.length > 1 ? "номере" : "объекте"}
        </h3>
        {bookings.filter((b) => b.unitId === unitId).length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Пока нет подтверждённых броней.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {bookings
              .filter((b) => b.unitId === unitId)
              .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
              .map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-0.5 rounded-md bg-muted/40 px-3 py-1.5 text-xs"
                >
                  <span className="font-medium">{b.clientName}</span>
                  <span className="text-muted-foreground">
                    {b.checkIn} → {b.checkOut}
                  </span>
                  <span className="text-muted-foreground">{b.nights} ноч.</span>
                  <span className="text-muted-foreground">
                    {b.price.toLocaleString("ru-RU")} ₽
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
