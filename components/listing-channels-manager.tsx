"use client";

import { useState } from "react";
import { Cable, Loader2, Plug, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CHANNEL_MANAGERS, getChannelManager } from "@/lib/channels";
import type {
  ListingChannelConnection,
  ListingChannelType,
} from "@noble-peak/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ListingChannelsManagerProps {
  initialConnections?: ListingChannelConnection[];
  onChange: (connections: ListingChannelConnection[]) => void;
  listingId?: string;
}

export function ListingChannelsManager({
  initialConnections = [],
  onChange,
  listingId,
}: ListingChannelsManagerProps) {
  const [connections, setConnections] =
    useState<ListingChannelConnection[]>(initialConnections);
  const [draftType, setDraftType] = useState<ListingChannelType | "">("");
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  const manager = draftType ? getChannelManager(draftType) : undefined;

  const commit = (next: ListingChannelConnection[]) => {
    setConnections(next);
    onChange(next);
  };

  const resetDraft = () => {
    setDraftType("");
    setDraftValues({});
  };

  const addConnection = () => {
    if (!manager) return;
    const credentials = manager.credentialFields.map((field) => ({
      key: field.key,
      value: draftValues[field.key]?.trim() ?? "",
    }));
    commit([
      ...connections,
      {
        id: crypto.randomUUID(),
        type: manager.type,
        credentials,
        connectedAt: new Date().toISOString(),
      },
    ]);
    resetDraft();
  };

  const removeConnection = (id: string) =>
    commit(connections.filter((c) => c.id !== id));

  const connectBnovo = async (conn: ListingChannelConnection) => {
    if (!listingId) {
      toast.error("Сохраните объявление, чтобы подключить канал");
      return;
    }
    const creds = Object.fromEntries(
      conn.credentials.map((c) => [c.key, c.value])
    );
    if (!creds.login || !creds.password) {
      toast.error("Введите логин и пароль API Bnovo");
      return;
    }
    setConnectingId(conn.id);
    try {
      const res = await fetch("/api/channels/bnovo/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: conn.id,
          listingId,
          login: creds.login,
          password: creds.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Не удалось подключить Bnovo");
        return;
      }
      setConnected((prev) => ({ ...prev, [conn.id]: true }));
      toast.success(
        data.webhookRegistered
          ? "Аккаунт Bnovo подключён, вебхуки зарегистрированы"
          : "Аккаунт Bnovo подключён"
      );
    } catch {
      toast.error("Ошибка подключения к Bnovo");
    } finally {
      setConnectingId(null);
    }
  };

  const syncNow = async (conn: ListingChannelConnection) => {
    if (!listingId) {
      toast.error("Сохраните объявление, чтобы синхронизировать календарь");
      return;
    }
    setSyncingId(conn.id);
    try {
      const res = await fetch("/api/channels/bnovo/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Ошибка синхронизации");
        return;
      }
      const result = data.results?.[listingId];
      toast.success(
        result?.ok
          ? "Синхронизация с Bnovo выполнена"
          : "Синхронизация завершена с ошибкой"
      );
    } catch {
      toast.error("Ошибка синхронизации");
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Cable className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium">Менеджеры каналов</p>
          <p className="text-sm text-muted-foreground">
            Подключите аккаунты менеджеров каналов для двухсторонней
            синхронизации календаря.
          </p>
        </div>
      </div>

      {connections.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Plug className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            Каналы пока не подключены. Добавьте менеджер канала, чтобы включить
            синхронизацию календаря.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {connections.map((conn) => {
            const def = getChannelManager(conn.type);
            const isBnovo = conn.type === "bnovo";
            const isBusy = connectingId === conn.id || syncingId === conn.id;
            return (
              <li key={conn.id} className="space-y-2 rounded-xl border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {def?.name ?? conn.type}
                      {connected[conn.id] && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                          подключён
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {conn.credentials
                        .map((c) => (c.value ? "••••••••" : `${c.key}: пусто`))
                        .join(" · ") || "Нет данных аккаунта"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {isBnovo && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => connectBnovo(conn)}
                          disabled={isBusy}
                        >
                          {connectingId === conn.id ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <Plug className="mr-1 h-4 w-4" />
                          )}
                          Проверить
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => syncNow(conn)}
                          disabled={isBusy}
                        >
                          {syncingId === conn.id ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-1 h-4 w-4" />
                          )}
                          Синхронизировать
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Отключить канал"
                      onClick={() => removeConnection(conn.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-3 rounded-xl border p-4">
        <div className="space-y-2">
          <Label>Канал</Label>
          <Select
            value={draftType || undefined}
            onValueChange={(value) => {
              setDraftType(value as ListingChannelType);
              setDraftValues({});
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите менеджера канала" />
            </SelectTrigger>
            <SelectContent>
              {CHANNEL_MANAGERS.map((c) => (
                <SelectItem key={c.type} value={c.type}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {manager && (
          <>
            <p className="text-xs text-muted-foreground">
              {manager.description}
            </p>
            <div className="space-y-3">
              {manager.credentialFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  <Input
                    type={field.type}
                    value={draftValues[field.key] ?? ""}
                    onChange={(e) =>
                      setDraftValues((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addConnection}
              className="w-full"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Подключить канал
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
