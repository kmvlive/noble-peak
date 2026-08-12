import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function transliterate(text: string): string {
  const chars: string[] = [];
  for (const ch of text) {
    const lower = ch.toLowerCase();
    const latin = CYRILLIC_TO_LATIN[lower];
    if (latin !== undefined) {
      chars.push(
        ch === lower ? latin : latin.charAt(0).toUpperCase() + latin.slice(1)
      );
    } else {
      chars.push(ch);
    }
  }
  return chars.join("");
}

export function slugify(text: string): string {
  return transliterate(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function computePartnerToPay(
  activity: {
    orderType?: string;
    partnerPrice?: number;
    partnerPricePercent?: number;
  } | null,
  price: number
): number {
  if (!activity) return price;
  if (activity.orderType === "order_form") return price;
  if (typeof activity.partnerPrice === "number") return activity.partnerPrice;
  if (typeof activity.partnerPricePercent === "number") {
    return Math.round(price * (activity.partnerPricePercent / 100));
  }
  return price;
}
