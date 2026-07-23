"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarDateEntry {
  available: boolean;
  hours?: string[];
}

interface ActivityBookingCalendarProps {
  activityId: string;
  onSelect: (date: string, time?: string) => void;
  selectedDate: string | null;
  selectedTime: string | null;
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
  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(d);
  }

  return days;
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isDateInPast(year: number, month: number, day: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(year, month, day);
  return date < today;
}

export function ActivityBookingCalendar({
  activityId,
  onSelect,
  selectedDate: externalSelectedDate,
  selectedTime: externalSelectedTime,
}: ActivityBookingCalendarProps) {
  const [dates, setDates] = useState<Record<string, CalendarDateEntry>>({});
  const [loading, setLoading] = useState(true);
  const [internalSelectedDate, setInternalSelectedDate] = useState<
    string | null
  >(externalSelectedDate);
  const [selectedHour, setSelectedHour] = useState<string | null>(
    externalSelectedTime
  );

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  useEffect(() => {
    setInternalSelectedDate(externalSelectedDate);
  }, [externalSelectedDate]);

  useEffect(() => {
    setSelectedHour(externalSelectedTime);
  }, [externalSelectedTime]);

  useEffect(() => {
    const fetchCalendar = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/activities/${activityId}/calendar`);
        const data = await res.json();
        setDates(data.dates || {});
      } catch {
        setDates({});
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, [activityId]);

  const monthDays = getMonthDays(year, month);

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
    setInternalSelectedDate(null);
    setSelectedHour(null);
    onSelect("", undefined);
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
    setInternalSelectedDate(null);
    setSelectedHour(null);
    onSelect("", undefined);
  };

  const handleDateClick = (dateStr: string) => {
    const entry = dates[dateStr];
    if (!entry?.available) return;

    if (internalSelectedDate === dateStr) {
      setInternalSelectedDate(null);
      setSelectedHour(null);
      onSelect("", undefined);
      return;
    }

    setInternalSelectedDate(dateStr);
    setSelectedHour(null);

    if (!entry.hours || entry.hours.length === 0) {
      onSelect(dateStr, undefined);
    }
  };

  const handleHourClick = (hour: string) => {
    if (!internalSelectedDate) return;
    const newHour = selectedHour === hour ? null : hour;
    setSelectedHour(newHour);
    if (newHour) {
      onSelect(internalSelectedDate, newHour);
    } else {
      onSelect(internalSelectedDate, undefined);
    }
  };

  const selectedEntry = internalSelectedDate
    ? dates[internalSelectedDate]
    : null;
  const hasHours = selectedEntry?.hours && selectedEntry.hours.length > 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
            <div className="h-5 w-36 rounded bg-muted animate-pulse" />
            <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px rounded-lg border bg-muted overflow-hidden">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square bg-background p-1 sm:p-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="outline" size="icon-sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] sm:min-w-[160px] text-center text-sm font-medium">
            {MONTHS[month]} {year}
          </span>
          <Button variant="outline" size="icon-sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px rounded-lg border bg-muted overflow-hidden">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="bg-muted/50 px-1 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {name}
          </div>
        ))}
        {monthDays.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="bg-background p-1" />;
          }

          const dateStr = formatDate(year, month, day);
          const entry = dates[dateStr];
          const isAvailable = entry?.available ?? false;
          const isPast = isDateInPast(year, month, day);
          const isSelected = internalSelectedDate === dateStr;
          const hasHoursForDate =
            isAvailable && entry?.hours && entry.hours.length > 0;
          const canSelect = isAvailable && !isPast;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={!canSelect}
              onClick={() => handleDateClick(dateStr)}
              className={`relative bg-background p-0.5 sm:p-1 text-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed ${
                canSelect ? "hover:bg-accent/50" : ""
              } ${isSelected ? "ring-2 ring-primary ring-inset" : ""}`}
            >
              <span
                className={`inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-medium"
                    : isAvailable && !isPast
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground"
                }`}
              >
                {day}
              </span>
              {hasHoursForDate && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
                  <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {internalSelectedDate && hasHours && selectedEntry?.hours && (
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="text-sm font-semibold">
            Доступное время на {internalSelectedDate}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {selectedEntry.hours.map((hour) => {
              const isActive = selectedHour === hour;
              return (
                <button
                  key={hour}
                  type="button"
                  onClick={() => handleHourClick(hour)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input text-foreground hover:bg-accent"
                  }`}
                >
                  {isActive && <Check className="h-3.5 w-3.5" />}
                  {hour}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {internalSelectedDate && !hasHours && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-4">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            <Check className="mr-1.5 inline-block h-4 w-4" />
            Весь день доступен — {internalSelectedDate}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-primary/10 border border-primary/30" />
          Доступно
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          Есть часы
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-muted border" />
          Нет мест
        </span>
      </div>
    </div>
  );
}
