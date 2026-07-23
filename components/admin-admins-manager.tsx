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
  ShieldAlert,
  UserPlus,
  Pencil,
  Trash2,
  Shield,
  Mail,
  User,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Admin {
  email: string;
  name: string;
  role: "main_admin" | "admin";
  createdAt: string;
  updatedAt: string;
}

interface AdminFormData {
  email: string;
  password: string;
  name: string;
  role: "main_admin" | "admin";
}

const emptyForm: AdminFormData = {
  email: "",
  password: "",
  name: "",
  role: "admin",
};

function AdminFormDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Admin | null;
  onSubmit: (data: AdminFormData) => Promise<void>;
}) {
  const [form, setForm] = useState<AdminFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        email: editing.email,
        password: "",
        name: editing.name,
        role: editing.role,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Введите имя администратора");
      return;
    }
    if (!editing && !form.password.trim()) {
      toast.error("Введите пароль");
      return;
    }
    if (!editing && !form.email.trim()) {
      toast.error("Введите email");
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
          <DialogTitle>
            {editing
              ? "Редактировать администратора"
              : "Добавить администратора"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Измените данные администратора"
              : "Создайте нового администратора с ограниченными правами"}
          </DialogDescription>
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
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@example.com"
              required
              disabled={!!editing}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Пароль {editing && "(оставьте пустым, чтобы не менять)"}
            </label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editing ? "Новый пароль" : "Минимум 4 символа"}
              required={!editing}
              minLength={4}
            />
          </div>
          {editing && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Роль</label>
              <Select
                value={form.role}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    role: (value ?? "admin") as "main_admin" | "admin",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="main_admin">Главный</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
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
              {editing ? "Сохранить" : "Добавить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminAdminsManager() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function fetchAdmins() {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch("/api/admin/admins", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setAdmins(await res.json());
      } else {
        toast.error("Ошибка загрузки администраторов");
      }
    } catch {
      toast.error("Ошибка загрузки администраторов");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data: AdminFormData) {
    const token = getToken();
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success("Администратор добавлен");
      setDialogOpen(false);
      await fetchAdmins();
    } else {
      const err = await res.json();
      toast.error(err.error || "Ошибка добавления администратора");
    }
  }

  async function handleUpdate(data: AdminFormData) {
    const token = getToken();
    const body: Record<string, string> = { email: data.email };
    if (data.password) body.password = data.password;
    if (data.name !== editing?.name) body.name = data.name;
    if (data.role !== editing?.role) body.role = data.role;

    const res = await fetch("/api/admin/admins", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success("Администратор обновлён");
      setDialogOpen(false);
      await fetchAdmins();
    } else {
      const err = await res.json();
      toast.error(err.error || "Ошибка обновления администратора");
    }
  }

  async function handleDelete(admin: Admin) {
    const confirmed = confirm(
      `Удалить администратора ${admin.name} (${admin.email})?`
    );
    if (!confirmed) return;

    const token = getToken();
    const res = await fetch("/api/admin/admins", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email: admin.email }),
    });

    if (res.ok) {
      toast.success("Администратор удалён");
      await fetchAdmins();
    } else {
      const err = await res.json();
      toast.error(err.error || "Ошибка удаления администратора");
    }
  }

  function openEdit(admin: Admin) {
    setEditing(admin);
    setDialogOpen(true);
  }

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Администраторы</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Управление дополнительными администраторами
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAdmins}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Обновить
          </Button>
          <Button onClick={openCreate}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Добавить
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : admins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Shield className="h-8 w-8" />
          </div>
          <p className="text-lg font-medium">Нет администраторов</p>
          <p className="text-sm">Добавьте первого администратора</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead className="w-24">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.email}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{admin.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {admin.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {admin.role === "main_admin" ? (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        <ShieldAlert className="mr-1 h-3 w-3" />
                        Главный
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        <Shield className="mr-1 h-3 w-3" />
                        Администратор
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(admin)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(admin)}
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

      <AdminFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
      />
    </div>
  );
}
