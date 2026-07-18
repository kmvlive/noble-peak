"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, Phone, FileText, CalendarDays, Clock } from "lucide-react";
import { toast } from "sonner";

interface BookingFormProps {
  activityId: string;
  activityTitle: string;
  date: string;
  time: string | null;
  clientName: string;
  clientPhone: string;
  price: number;
}

export function BookingForm({
  activityId,
  activityTitle,
  date,
  time,
  clientName: initialName,
  clientPhone: initialPhone,
  price,
}: BookingFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !phone) {
      toast.error("Заполните имя и телефон");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId,
          activityTitle,
          date,
          time,
          clientName: name,
          clientPhone: phone,
          details,
          price,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Необходимо войти в личный кабинет");
          router.push("/client/login");
          return;
        }
        toast.error(data.error || "Ошибка бронирования");
        return;
      }

      toast.success("Бронирование подтверждено!");
      router.push(`/client/bookings/${data.booking.id}`);
    } catch {
      toast.error("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <h3 className="text-base font-semibold">Оформление бронирования</h3>

      <div className="space-y-1.5 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          {activityTitle} — {date}
        </p>
        {time && (
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {time}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Имя</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10"
            placeholder="Ваше имя"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Телефон</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="pl-10"
            placeholder="+7 (999) 123-45-67"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Мои подробности
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="min-h-[80px] pl-10"
            placeholder="Пожелания, особые требования..."
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Бронируем..." : "Забронировать"}
      </Button>
    </form>
  );
}
