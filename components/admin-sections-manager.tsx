"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  FolderOpen,
  Waves,
  Mountain,
  UtensilsCrossed,
  Bike,
  Map,
  Gamepad2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getToken } from "./admin-layout-client";
import { slugify } from "@/lib/utils";

const ICON_MAP: Record<string, React.ReactNode> = {
  FolderOpen: <FolderOpen className="h-4 w-4" />,
  Waves: <Waves className="h-4 w-4" />,
  Mountain: <Mountain className="h-4 w-4" />,
  UtensilsCrossed: <UtensilsCrossed className="h-4 w-4" />,
  Bike: <Bike className="h-4 w-4" />,
  Map: <Map className="h-4 w-4" />,
  Gamepad2: <Gamepad2 className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

const GRADIENT_OPTIONS = [
  "from-blue-400 to-indigo-500",
  "from-emerald-400 to-cyan-500",
  "from-orange-400 to-rose-500",
  "from-amber-500 to-yellow-400",
  "from-cyan-400 to-teal-500",
  "from-stone-400 to-zinc-500",
  "from-purple-400 to-violet-500",
  "from-sky-400 to-blue-600",
  "from-red-400 to-pink-500",
  "from-orange-400 to-red-500",
];

interface SectionItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  imageGradient: string;
  category: string;
}

export function AdminSectionsManager() {
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("FolderOpen");
  const [gradient, setGradient] = useState(GRADIENT_OPTIONS[0]);

  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState<SectionItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIcon, setEditIcon] = useState("FolderOpen");
  const [editGradient, setEditGradient] = useState(GRADIENT_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const res = await fetch("/api/admin/sections");
      const data = await res.json();
      setSections(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Ошибка загрузки разделов");
    } finally {
      setLoading(false);
    }
  };

  const generateId = (val: string) => slugify(val);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Название обязательно");
      return;
    }

    const id = generateId(name);
    if (!id) {
      toast.error("Некорректное название");
      return;
    }

    if (sections.some((s) => s.id === id)) {
      toast.error("Раздел с таким ID уже существует");
      return;
    }

    setCreating(true);
    const token = getToken();

    try {
      const res = await fetch("/api/admin/sections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id,
          name: name.trim(),
          description: description.trim(),
          icon,
          imageGradient: gradient,
          category: name.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Ошибка создания раздела");
        return;
      }

      toast.success(`Раздел «${name}» создан`);
      setName("");
      setDescription("");
      setIcon("FolderOpen");
      setGradient(GRADIENT_OPTIONS[0]);
      fetchSections();
    } catch {
      toast.error("Ошибка создания раздела");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (section: SectionItem) => {
    if (!confirm(`Удалить раздел «${section.name}»?`)) return;

    const token = getToken();

    try {
      const res = await fetch("/api/admin/sections", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: section.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Ошибка удаления");
        return;
      }

      toast.success(`Раздел «${section.name}» удалён`);
      setSections((prev) => prev.filter((s) => s.id !== section.id));
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const startEdit = (section: SectionItem) => {
    setEditing(section);
    setEditName(section.name);
    setEditDescription(section.description || "");
    setEditIcon(
      ICON_OPTIONS.includes(section.icon) ? section.icon : "FolderOpen"
    );
    setEditGradient(
      GRADIENT_OPTIONS.includes(section.imageGradient)
        ? section.imageGradient
        : GRADIENT_OPTIONS[0]
    );
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditName("");
    setEditDescription("");
    setEditIcon("FolderOpen");
    setEditGradient(GRADIENT_OPTIONS[0]);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editing) return;

    if (!editName.trim()) {
      toast.error("Название обязательно");
      return;
    }

    setSaving(true);
    const token = getToken();

    try {
      const res = await fetch("/api/admin/sections", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editing.id,
          name: editName.trim(),
          description: editDescription.trim(),
          icon: editIcon,
          imageGradient: editGradient,
          category: editName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Ошибка обновления раздела");
        return;
      }

      toast.success(`Раздел «${editName.trim()}» обновлён`);
      cancelEdit();
      fetchSections();
    } catch {
      toast.error("Ошибка обновления раздела");
    } finally {
      setSaving(false);
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Разделы</h1>

      <form onSubmit={handleCreate} className="space-y-4 rounded-lg border p-4">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Создать раздел
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="section-name" className="text-sm font-medium">
              Название
            </label>
            <Input
              id="section-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Водные активности"
            />
            {name && (
              <p className="text-xs text-muted-foreground">
                ID: {generateId(name) || "..."}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="section-description"
              className="text-sm font-medium"
            >
              Описание
            </label>
            <Input
              id="section-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Сплавы, яхтинг, дайвинг..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Иконка</label>
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {ICON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Выбрано:</span>
              <span className="flex h-6 w-6 items-center justify-center rounded border">
                {ICON_MAP[icon]}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Градиент</label>
            <select
              value={gradient}
              onChange={(e) => setGradient(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {GRADIENT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Превью:</span>
              <span
                className={`inline-block h-4 w-12 rounded bg-gradient-to-r ${gradient}`}
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={creating || !name.trim()}>
          <Plus className="mr-1.5 h-4 w-4" />
          {creating ? "Создание..." : "Создать раздел"}
        </Button>
      </form>

      {editing && (
        <form
          onSubmit={handleUpdate}
          className="space-y-4 rounded-lg border p-4 ring-1 ring-primary/20"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Редактировать раздел «{editing.name}»
            </h2>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Отмена"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="edit-section-name"
                className="text-sm font-medium"
              >
                Название
              </label>
              <Input
                id="edit-section-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Водные активности"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="edit-section-description"
                className="text-sm font-medium"
              >
                Описание
              </label>
              <Input
                id="edit-section-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Сплавы, яхтинг, дайвинг..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Иконка</label>
              <select
                value={editIcon}
                onChange={(e) => setEditIcon(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Выбрано:</span>
                <span className="flex h-6 w-6 items-center justify-center rounded border">
                  {ICON_MAP[editIcon]}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Градиент</label>
              <select
                value={editGradient}
                onChange={(e) => setEditGradient(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {GRADIENT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Превью:</span>
                <span
                  className={`inline-block h-4 w-12 rounded bg-gradient-to-r ${editGradient}`}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving || !editName.trim()}>
              {saving ? "Сохранение..." : "Сохранить изменения"}
            </Button>
            <Button type="button" variant="outline" onClick={cancelEdit}>
              Отмена
            </Button>
          </div>
        </form>
      )}

      {sections.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
          <FolderOpen className="h-8 w-8" />
          <p className="text-sm">Разделов пока нет</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Раздел</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">
                  Описание
                </th>
                <th className="px-4 py-3 text-center font-medium hidden sm:table-cell">
                  Активностей
                </th>
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <tr
                  key={section.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${section.imageGradient} text-white`}
                      >
                        {ICON_MAP[section.icon] || (
                          <FolderOpen className="h-4 w-4" />
                        )}
                      </span>
                      <div>
                        <p className="font-medium">{section.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {section.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell max-w-xs truncate">
                    {section.description}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell text-muted-foreground">
                    —
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => startEdit(section)}
                        aria-label={`Редактировать ${section.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(section)}
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
