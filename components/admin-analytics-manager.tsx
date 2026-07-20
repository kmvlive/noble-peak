"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, Plus, Trash2, Code, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";

interface AnalyticsCounter {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

export function AdminAnalyticsManager() {
  const [counters, setCounters] = useState<AnalyticsCounter[]>([]);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCounters = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/analytics-counters");
      if (!res.ok) throw new Error("Ошибка загрузки счётчиков");
      const data = await res.json();
      setCounters(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Не удалось загрузить счётчики");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounters();
  }, [fetchCounters]);

  const addCounter = async () => {
    if (!newName.trim() || !newCode.trim()) {
      toast.error("Заполните название и код счётчика");
      return;
    }

    setSaving(true);
    const id = toast.loading("Сохраняем...");
    try {
      const res = await fetch("/api/admin/analytics-counters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), code: newCode.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка сохранения");
      }
      const created = await res.json();
      setCounters((prev) => [...prev, created]);
      setNewName("");
      setNewCode("");
      toast.success("Счётчик добавлен", { id });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка сохранения", { id });
    } finally {
      setSaving(false);
    }
  };

  const deleteCounter = async (id: string) => {
    const id2 = toast.loading("Удаляем...");
    try {
      const res = await fetch(`/api/admin/analytics-counters?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка удаления");
      }
      setCounters((prev) => prev.filter((c) => c.id !== id));
      toast.success("Счётчик удалён", { id: id2 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка удаления", {
        id: id2,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Статистика</h1>
        <p className="text-muted-foreground">
          Управление счётчиками аналитики на сайте
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Добавить счётчик
          </CardTitle>
          <CardDescription>
            Вставьте код счётчика (Яндекс.Метрика, Google Analytics и другие).
            Код будет подключён на всех страницах сайта.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Название счётчика (например, Яндекс.Метрика)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Textarea
            placeholder="HTML/JS код счётчика"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            rows={6}
            className="font-mono text-xs"
          />
          <Button
            onClick={addCounter}
            disabled={saving || !newName.trim() || !newCode.trim()}
          >
            {saving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-1.5 h-4 w-4" />
            )}
            Добавить счётчик
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Установленные счётчики
          </CardTitle>
          <CardDescription>
            {counters.length === 0
              ? "Нет добавленных счётчиков"
              : `${counters.length} счётчик(а)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {counters.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Счётчики не добавлены. Используйте форму выше, чтобы добавить код
              аналитики.
            </p>
          ) : (
            counters.map((counter) => (
              <div
                key={counter.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {counter.name}
                    </span>
                  </div>
                  <details className="mt-1">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      Показать код
                    </summary>
                    <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs font-mono whitespace-pre-wrap break-all">
                      {counter.code}
                    </pre>
                  </details>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteCounter(counter.id)}
                  title="Удалить счётчик"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
