"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Save, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getToken } from "./admin-layout-client";

interface CalendarDateEntry {
  available: boolean;
  hours?: string[];
}

interface AdminActivityCalendarProps {
  activityId: string;
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

function isTodayOrFuture(dateStr: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dateStr >= today;
}

const HOUR_PRESETS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

export function AdminActivityCalendar({
  activityId,
}: AdminActivityCalendarProps) {
  const [dates, setDates] = useState<Record<string, CalendarDateEntry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingHours, setEditingHours] = useState<string[]>([]);
  const [newHour, setNewHour] = useState("");
  const [lastClickedDate, setLastClickedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalendar = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/activities/${activityId}/calendar`);
        const data = await res.json();
        setDates(data.dates || {});
      } catch {
        toast.error("Ошибка загрузки календаря");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, [activityId]);

  const handleSave = async () => {
    setSaving(true);
    const token = getToken();

    try {
      const res = await fetch(`/api/admin/activities/${activityId}/calendar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dates }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Ошибка сохранения");
        return;
      }

      toast.success("Календарь сохранён");
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const toggleDate = useCallback((dateStr: string) => {
    setDates((prev) => {
      const current = prev[dateStr];
      if (current?.available) {
        const next = { ...prev };
        delete next[dateStr];
        return next;
      }
      return {
        ...prev,
        [dateStr]: { available: true },
      };
    });
  }, []);

  const selectDate = (dateStr: string) => {
    if (selectedDate === dateStr) {
      setSelectedDate(null);
      setEditingHours([]);
      return;
    }
    setSelectedDate(dateStr);
    const entry = dates[dateStr];
    setEditingHours(entry?.hours ? [...entry.hours] : []);
    setNewHour("");
  };

  const selectDateRange = (start: string, end: string) => {
    const [rangeStart, rangeEnd] = [start, end].sort();
    const range: string[] = [];
    const current = new Date(rangeStart + "T00:00:00Z");
    const endDate = new Date(rangeEnd + "T00:00:00Z");

    while (current <= endDate) {
      const dateStr = current.toISOString().split("T")[0];
      if (isTodayOrFuture(dateStr)) {
        range.push(dateStr);
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    setDates((prev) => {
      const next = { ...prev };
      range.forEach((dateStr) => {
        next[dateStr] = { available: true };
      });
      return next;
    });
  };

  const handleDateClick = (
    dateStr: string,
    _day: number,
    e: React.MouseEvent
  ) => {
    if (!isTodayOrFuture(dateStr)) return;

    if (e.shiftKey && lastClickedDate && lastClickedDate !== dateStr) {
      selectDateRange(lastClickedDate, dateStr);
      return;
    }

    setLastClickedDate(dateStr);

    if (dates[dateStr]?.available) {
      selectDate(dateStr);
    } else {
      toggleDate(dateStr);
    }
  };

  const toggleHourPreset = (hour: string) => {
    if (!selectedDate) return;

    const newHours = editingHours.includes(hour)
      ? editingHours.filter((h) => h !== hour)
      : [...editingHours, hour].sort();

    setEditingHours(newHours);

    setDates((prev) => ({
      ...prev,
      [selectedDate]: {
        available: true,
        hours: newHours.length > 0 ? newHours : undefined,
      },
    }));
  };

  const addCustomHour = () => {
    const trimmed = newHour.trim();
    if (!trimmed) return;
    if (!/^\d{1,2}:\d{2}$/.test(trimmed)) {
      toast.error("Формат: ЧЧ:ММ");
      return;
    }
    if (editingHours.includes(trimmed)) return;

    const updated = [...editingHours, trimmed].sort();
    setEditingHours(updated);
    setNewHour("");

    if (selectedDate) {
      setDates((prev) => ({
        ...prev,
        [selectedDate]: {
          available: true,
          hours: updated.length > 0 ? updated : undefined,
        },
      }));
    }
  };

  const monthDays = getMonthDays(year, month);

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDate(null);
    setEditingHours([]);
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDate(null);
    setEditingHours([]);
  };

  const goToToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDate(null);
    setEditingHours([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Загрузка календаря...
      </div>
    );
  }

  const selectedEntry = selectedDate ? dates[selectedDate] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[160px] text-center text-sm font-medium">
            {MONTHS[month]} {year}
          </span>
          <Button variant="outline" size="icon-sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Сегодня
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "Сохранение..." : "Сохранить"}
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
          if (day === null) {
            return <div key={`empty-${i}`} className="bg-background p-2" />;
          }

          const dateStr = formatDate(year, month, day);
          const entry = dates[dateStr];
          const isAvailable = entry?.available;
          const isSelected = selectedDate === dateStr;
          const hasHours =
            isAvailable && entry?.hours && entry.hours.length > 0;
          const isPast = !isTodayOrFuture(dateStr);
          const isBlocked = isPast;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={(e) => handleDateClick(dateStr, day, e)}
              disabled={isBlocked}
              className={`relative bg-background p-2 text-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                isBlocked
                  ? "cursor-not-allowed opacity-30"
                  : "hover:bg-accent/50"
              } ${isSelected ? "ring-2 ring-primary ring-inset" : ""}`}
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                  isBlocked
                    ? "text-muted-foreground"
                    : isAvailable
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-foreground"
                }`}
              >
                {day}
              </span>
              {hasHours && !isBlocked && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
                  <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-primary" />
          Доступно
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          Есть часы
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border bg-background" />
          Недоступно
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-muted opacity-30" />
          Прошедшие
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Shift+клик — выбрать диапазон дат. Клик на дату — выбрать/отметить часы.
      </p>

      {selectedDate && (
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Часы для {selectedDate}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDates((prev) => {
                  const next = { ...prev };
                  delete next[selectedDate];
                  return next;
                });
                setSelectedDate(null);
                setEditingHours([]);
              }}
            >
              <X className="mr-1 h-3 w-3" />
              Убрать дату
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {selectedEntry?.hours && selectedEntry.hours.length > 0
              ? `Выбрано ${selectedEntry.hours.length} часов. Если не отметить ни одного — доступен весь день.`
              : "Часы не выбраны — доступен весь день."}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {HOUR_PRESETS.map((hour) => {
              const isActive = editingHours.includes(hour);
              return (
                <button
                  key={hour}
                  type="button"
                  onClick={() => toggleHourPreset(hour)}
                  className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {hour}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={newHour}
              onChange={(e) => setNewHour(e.target.value)}
              placeholder="ЧЧ:ММ"
              className="w-24"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomHour();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomHour}
            >
              Добавить час
            </Button>
          </div>

          {editingHours.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {editingHours.map((hour) => (
                <span
                  key={hour}
                  className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                >
                  {hour}
                  <button
                    type="button"
                    onClick={() => toggleHourPreset(hour)}
                    className="text-primary/60 hover:text-primary"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border p-3">
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
          Всего отмечено дат:{" "}
          {Object.values(dates).filter((d) => d.available).length}
        </h3>
        <div className="flex flex-wrap gap-1">
          {Object.entries(dates)
            .filter(([, entry]) => entry.available)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(0, 20)
            .map(([dateStr, entry]) => (
              <span
                key={dateStr}
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                {dateStr.slice(5)}
                {entry.hours && entry.hours.length > 0 && (
                  <Clock className="h-2.5 w-2.5" />
                )}
              </span>
            ))}
          {Object.values(dates).filter((d) => d.available).length > 20 && (
            <span className="text-xs text-muted-foreground">
              +{Object.values(dates).filter((d) => d.available).length - 20}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
