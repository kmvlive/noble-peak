"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface FooterMenuItem {
  id: string;
  menuType: string;
  name: string;
  url: string;
  order: number;
}

export function FooterMenu() {
  const [items, setItems] = useState<FooterMenuItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/menu?type=footer");
        const data = await res.json();
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          console.error("Ошибка загрузки пунктов нижнего меню");
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6">
        {items.length > 0 && (
          <nav className="flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-3 md:gap-x-6 md:gap-y-2 mb-4">
            {items
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors min-h-9 flex items-center"
                >
                  {item.name}
                </Link>
              ))}
          </nav>
        )}
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Магазин туров и активностей
        </p>
      </div>
    </footer>
  );
}
