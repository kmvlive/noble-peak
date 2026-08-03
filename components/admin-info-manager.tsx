"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, FileText, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getToken } from "./admin-layout-client";

interface InfoPage {
  id: string;
  target: "partner" | "tourist";
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export function AdminInfoManager() {
  const [pages, setPages] = useState<InfoPage[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState<"partner" | "tourist">("partner");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTarget, setEditTarget] = useState<"partner" | "tourist">(
    "partner"
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const token = getToken();
      const res = await fetch("/api/admin/info", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPages(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Ошибка загрузки страниц");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Заполните все поля");
      return;
    }

    setCreating(true);
    const token = getToken();

    try {
      const res = await fetch("/api/admin/info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target,
          title: title.trim(),
          content: content.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Ошибка создания");
        return;
      }

      toast.success(`Страница «${title}» создана`);
      setTitle("");
      setContent("");
      setTarget("partner");
      fetchPages();
    } catch {
      toast.error("Ошибка создания страницы");
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (page: InfoPage) => {
    setEditingId(page.id);
    setEditTitle(page.title);
    setEditContent(page.content);
    setEditTarget(page.target);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditTarget("partner");
  };

  const handleSave = async (id: string) => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error("Заполните все поля");
      return;
    }

    setSaving(true);
    const token = getToken();

    try {
      const res = await fetch(`/api/admin/info/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
          target: editTarget,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Ошибка сохранения");
        return;
      }

      toast.success("Страница обновлена");
      cancelEditing();
      fetchPages();
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (page: InfoPage) => {
    if (!confirm(`Удалить страницу «${page.title}»?`)) return;

    const token = getToken();

    try {
      const res = await fetch(`/api/admin/info/${page.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Ошибка удаления");
        return;
      }

      toast.success(`Страница «${page.title}» удалена`);
      setPages((prev) => prev.filter((p) => p.id !== page.id));
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const targetLabel = (t: "partner" | "tourist") =>
    t === "partner" ? "Партнёры" : "Туристы";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="space-y-4 rounded-lg border p-4">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Создать страницу
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="info-title" className="text-sm font-medium">
              Заголовок
            </label>
            <Input
              id="info-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Как добавлять активности"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Для кого</label>
            <select
              value={target}
              onChange={(e) =>
                setTarget(e.target.value as "partner" | "tourist")
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="partner">Партнёры</option>
              <option value="tourist">Туристы</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="info-content" className="text-sm font-medium">
            Содержание (HTML)
          </label>
          <textarea
            id="info-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="<p>Текст информации...</p>"
            rows={6}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <Button
          type="submit"
          disabled={creating || !title.trim() || !content.trim()}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {creating ? "Создание..." : "Создать страницу"}
        </Button>
      </form>

      {pages.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
          <FileText className="h-8 w-8" />
          <p className="text-sm">Страниц пока нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <div
              key={page.id}
              className="rounded-lg border bg-card p-4 space-y-3"
            >
              {editingId === page.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Заголовок"
                    />
                    <select
                      value={editTarget}
                      onChange={(e) =>
                        setEditTarget(e.target.value as "partner" | "tourist")
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="partner">Партнёры</option>
                      <option value="tourist">Туристы</option>
                    </select>
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={6}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(page.id)}
                      disabled={saving}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      {saving ? "Сохранение..." : "Сохранить"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={cancelEditing}>
                      <X className="mr-1 h-4 w-4" />
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{page.title}</h3>
                        <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {targetLabel(page.target)}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => startEditing(page)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(page)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
