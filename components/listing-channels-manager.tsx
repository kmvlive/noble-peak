"use client";

import { useState } from "react";
import { Cable, Plug, Plus, Trash2 } from "lucide-react";
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
}

export function ListingChannelsManager({
  initialConnections = [],
  onChange,
}: ListingChannelsManagerProps) {
  const [connections, setConnections] =
    useState<ListingChannelConnection[]>(initialConnections);
  const [draftType, setDraftType] = useState<ListingChannelType | "">("");
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Cable className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium">Менеджеры каналов</p>
          <p className="text-sm text-muted-foreground">
            Подключите аккаунты менеджеров каналов для будущей синхронизации
            календаря. Реальная синхронизация появится позже.
          </p>
        </div>
      </div>

      {connections.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Plug className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            Каналы пока не подключены. Добавьте менеджер канала, чтобы
            подготовить объявление к синхронизации.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {connections.map((conn) => {
            const def = getChannelManager(conn.type);
            return (
              <li
                key={conn.id}
                className="flex items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {def?.name ?? conn.type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {conn.credentials
                      .map((c) => (c.value ? "••••••••" : `${c.key}: пусто`))
                      .join(" · ") || "Нет данных аккаунта"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Отключить канал"
                  onClick={() => removeConnection(conn.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
