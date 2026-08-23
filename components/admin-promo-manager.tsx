"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Pencil, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getToken } from "./admin-layout-client";

interface PromoActivity {
  id: string;
  title: string;
  section: string;
  price: number;
  likes: number;
  isPopular: boolean;
  location?: string;
}

export function AdminPromoManager() {
  const [activities, setActivities] = useState<PromoActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPromo();
  }, []);

  const fetchPromo = async () => {
    try {
      const res = await fetch("/api/admin/activities");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setActivities(list.filter((a) => a.isPopular));
    } catch {
      toast.error("Ошибка загрузки промо-активностей");
    } finally {
      setLoading(false);
    }
  };

  const handleUnmark = async (id: string, title: string) => {
    if (togglingId) return;
    setTogglingId(id);

    const token = getToken();
    try {
      const res = await fetch(`/api/admin/activities/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPopular: false }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Ошибка обновления");
        return;
      }

      toast.success(`Промо снято с «${title}»`);
      setActivities((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error("Ошибка обновления");
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Промо</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Активности с включённой пометкой «Популярная активность». Они попадают
          в блок «Популярные активности» на главной.
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
          <Heart className="h-8 w-8" />
          <p className="text-sm">Промо-активностей пока нет</p>
          <p className="text-xs">
            Отметьте «Популярная активность» в карточке активности, чтобы она
            появилась здесь
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Название</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">
                  Раздел
                </th>
                <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">
                  Цена
                </th>
                <th className="px-4 py-3 text-center font-medium hidden md:table-cell">
                  <Heart className="inline h-3.5 w-3.5" />
                </th>
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{activity.title}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {activity.section}
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    {activity.price.toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="inline-flex items-center gap-1 text-xs text-red-500">
                      <Heart className="h-3.5 w-3.5 fill-red-500" />
                      {activity.likes}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/activities/${activity.id}/edit`}>
                        <Button variant="ghost" size="icon-sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={togglingId === activity.id}
                        onClick={() =>
                          handleUnmark(activity.id, activity.title)
                        }
                      >
                        {togglingId === activity.id
                          ? "Сохранение..."
                          : "Снять промо"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
