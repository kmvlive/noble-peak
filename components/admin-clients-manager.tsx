"use client";

import { useState, useEffect } from "react";
import { getToken } from "./admin-layout-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  Users,
  Mail,
  Phone,
  User,
  Loader2,
  RefreshCw,
  Calendar,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Client {
  email: string;
  name: string;
  phone: string;
  createdAt: string;
}

interface ClientFormData {
  email: string;
  name: string;
  phone: string;
}

function ClientEditDialog({
  open,
  onOpenChange,
  client,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  onSubmit: (data: ClientFormData) => Promise<void>;
}) {
  const [form, setForm] = useState<ClientFormData>({
    email: "",
    name: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client) {
      setForm({
        email: client.email,
        name: client.name,
        phone: client.phone,
      });
    }
  }, [client, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Введите имя клиента");
      return;
    }

    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать клиента</DialogTitle>
          <DialogDescription>Измените данные клиента</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Имя</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Иван Иванов"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Телефон</label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+7 (999) 123-45-67"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={form.email}
              disabled
              className="text-muted-foreground"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Сохранить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminClientsManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch("/api/admin/clients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setClients(await res.json());
      } else {
        toast.error("Ошибка загрузки клиентов");
      }
    } catch {
      toast.error("Ошибка загрузки клиентов");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(data: ClientFormData) {
    const token = getToken();
    const body: Record<string, string> = { email: data.email };
    if (data.name !== editing?.name) body.name = data.name;
    if (data.phone !== editing?.phone) body.phone = data.phone;

    const res = await fetch("/api/admin/clients", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success("Клиент обновлён");
      setDialogOpen(false);
      await fetchClients();
    } else {
      const err = await res.json();
      toast.error(err.error || "Ошибка обновления клиента");
    }
  }

  async function handleDelete(client: Client) {
    const confirmed = confirm(
      `Удалить клиента ${client.name} (${client.email})?`
    );
    if (!confirmed) return;

    const token = getToken();
    const res = await fetch("/api/admin/clients", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email: client.email }),
    });

    if (res.ok) {
      toast.success("Клиент удалён");
      await fetchClients();
    } else {
      const err = await res.json();
      toast.error(err.error || "Ошибка удаления клиента");
    }
  }

  function openEdit(client: Client) {
    setEditing(client);
    setDialogOpen(true);
  }

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Клиенты</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Список зарегистрированных клиентов
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchClients}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Обновить
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Users className="h-8 w-8" />
          </div>
          <p className="text-lg font-medium">Нет клиентов</p>
          <p className="text-sm">Клиенты появятся после регистрации на сайте</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead className="w-24">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.email}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{client.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {client.phone || "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {client.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {formatDate(client.createdAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(client)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(client)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editing && (
        <ClientEditDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          client={editing}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
}
