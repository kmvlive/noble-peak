"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Heart,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getToken } from "./admin-layout-client";
import type { OrderType } from "@/lib/models";

interface ActivityItem {
  id: string;
  title: string;
  section: string;
  price: number;
  likes: number;
  orderType: OrderType;
  isPopular: boolean;
  location?: string;
}

export function AdminActivityList() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/admin/activities");
      const data = await res.json();
      setActivities(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Ошибка загрузки активностей");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Удалить активность «${title}»?`)) return;

    const token = getToken();
    try {
      const res = await fetch(`/api/admin/activities/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Ошибка удаления");
        return;
      }

      toast.success(`«${title}» удалена`);
      setActivities((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const filtered = activities.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Активности</h1>
        <Link href="/admin/activities/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-1.5 h-4 w-4" />
            Создать активность
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Поиск активностей..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
          <Search className="h-8 w-8" />
          <p className="text-sm">
            {search ? "Ничего не найдено" : "Активностей пока нет"}
          </p>
          {!search && (
            <Link href="/admin/activities/new" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Plus className="mr-1.5 h-4 w-4" />
                Создать первую
              </Button>
            </Link>
          )}
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
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">
                  Город / место
                </th>
                <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">
                  Цена
                </th>
                <th className="px-4 py-3 text-center font-medium hidden md:table-cell">
                  <Heart className="inline h-3.5 w-3.5" />
                </th>
                <th className="px-4 py-3 text-center font-medium hidden md:table-cell">
                  Заказ
                </th>
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((activity) => (
                <tr
                  key={activity.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{activity.title}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {activity.section}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {activity.location || "—"}
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    {activity.price.toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span
                      className={`inline-flex items-center gap-1 text-xs ${
                        activity.isPopular
                          ? "text-red-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      <Heart
                        className={`h-3.5 w-3.5 ${
                          activity.isPopular ? "fill-red-500" : ""
                        }`}
                      />
                      {activity.likes}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        activity.orderType === "payment"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {activity.orderType === "payment" ? (
                        <>
                          <ShoppingCart className="h-3 w-3" />
                          Оплата
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-3 w-3" />
                          Форма
                        </>
                      )}
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
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          handleDelete(activity.id, activity.title)
                        }
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
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
