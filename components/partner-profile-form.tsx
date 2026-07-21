"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getToken } from "@/components/partner-layout-client";

interface ProfileData {
  name: string;
  phone: string;
  email: string;
}

export function PartnerProfileForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/partner/login");
      return;
    }

    fetch("/api/partner/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка загрузки");
        return res.json();
      })
      .then((data: ProfileData) => {
        setProfile(data);
        setName(data.name);
        setPhone(data.phone);
      })
      .catch(() => {
        toast.error("Не удалось загрузить профиль");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() && !phone.trim()) {
      toast.error("Заполните хотя бы одно поле");
      return;
    }

    const token = getToken();
    if (!token) return;

    setSaving(true);
    const id = toast.loading("Сохраняем...");

    try {
      const res = await fetch("/api/partner/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(name !== profile?.name ? { name: name.trim() } : {}),
          ...(phone !== profile?.phone ? { phone: phone.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка сохранения");
      }

      const data = await res.json();
      setProfile(data);
      toast.success("Готово", { id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка сохранения", {
        id,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Не удалось загрузить профиль
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="h-8 w-8" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium">{profile.email}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Имя
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ваше имя"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-medium">
          Телефон
        </label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 (999) 000-11-22"
        />
      </div>

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Сохранить
      </Button>
    </form>
  );
}
