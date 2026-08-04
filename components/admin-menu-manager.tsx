"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getToken } from "./admin-layout-client";

interface MenuItem {
  id: string;
  menuType: "admin" | "client" | "partner" | "footer";
  name: string;
  url: string;
  order: number;
}

interface AdminMenuManagerProps {
  menuType: "admin" | "client" | "partner" | "footer";
  title: string;
  description: string;
}

export function AdminMenuManager({
  menuType,
  title,
  description,
}: AdminMenuManagerProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [menuType]);

  const fetchItems = async () => {
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/menu?type=${menuType}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        toast.error("Ошибка авторизации");
        return;
      }

      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Ошибка загрузки пунктов меню");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Название обязательно");
      return;
    }

    if (!url.trim()) {
      toast.error("URL обязателен");
      return;
    }

    setCreating(true);
    const token = getToken();

    try {
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          menuType,
          name: name.trim(),
          url: url.trim(),
          order: items.length,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Ошибка создания пункта меню");
        return;
      }

      toast.success(`Пункт «${name}» создан`);
      setName("");
      setUrl("");
      fetchItems();
    } catch {
      toast.error("Ошибка создания пункта меню");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (item: MenuItem) => {
    toast(`Удалить пункт меню «${item.name}»?`, {
      action: {
        label: "Удалить",
        onClick: () => confirmDelete(item),
      },
      cancel: { label: "Отмена", onClick: () => {} },
    });
  };

  const confirmDelete = async (item: MenuItem) => {
    const token = getToken();

    try {
      const res = await fetch(
        `/api/admin/menu/${item.id}?menuType=${menuType}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Ошибка удаления");
        return;
      }

      toast.success(`Пункт «${item.name}» удалён`);
      const data = await res.json();
      if (Array.isArray(data.items)) {
        setItems(data.items);
      } else {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const moveItem = async (item: MenuItem, direction: "up" | "down") => {
    const token = getToken();

    try {
      const res = await fetch(
        `/api/admin/menu/${item.id}?menuType=${menuType}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ direction }),
        }
      );

      if (!res.ok) {
        toast.error("Ошибка изменения порядка");
        return;
      }

      fetchItems();
    } catch {
      toast.error("Ошибка изменения порядка");
    }
  };

  const handleMoveUp = (item: MenuItem) => {
    moveItem(item, "up");
  };

  const handleMoveDown = (item: MenuItem) => {
    moveItem(item, "down");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <form onSubmit={handleCreate} className="space-y-4 rounded-lg border p-4">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Добавить пункт меню
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="menu-name" className="text-sm font-medium">
              Название
            </label>
            <Input
              id="menu-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Главная"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="menu-url" className="text-sm font-medium">
              URL
            </label>
            <Input
              id="menu-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={creating || !name.trim() || !url.trim()}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {creating ? "Создание..." : "Добавить пункт"}
        </Button>
      </form>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
          <GripVertical className="h-8 w-8" />
          <p className="text-sm">Пунктов меню пока нет</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-center font-medium w-16">
                  Порядок
                </th>
                <th className="px-4 py-3 text-left font-medium">Название</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">
                  URL
                </th>
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items
                .sort((a, b) => a.order - b.order)
                .map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(item)}
                          disabled={index === 0}
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ↑
                        </button>
                        <span className="text-xs text-muted-foreground w-4 text-center">
                          {item.order}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(item)}
                          disabled={index === items.length - 1}
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell font-mono text-xs">
                      {item.url}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(item)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
