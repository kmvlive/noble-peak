export interface LanguageOption {
  value: string;
  label: string;
}

export const ACTIVITY_LANGUAGES: LanguageOption[] = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "Английский" },
  { value: "de", label: "Немецкий" },
  { value: "fr", label: "Французский" },
  { value: "es", label: "Испанский" },
  { value: "it", label: "Итальянский" },
  { value: "zh", label: "Китайский" },
  { value: "tr", label: "Турецкий" },
  { value: "ar", label: "Арабский" },
];

export const DEFAULT_ACTIVITY_LANGUAGES = ["ru"];

export function languageLabel(value: string): string {
  const found = ACTIVITY_LANGUAGES.find((l) => l.value === value);
  return found?.label ?? value;
}
