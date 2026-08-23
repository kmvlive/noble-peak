"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Search,
  Loader2,
  Users,
  MapPin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listing-card";
import { RUSSIAN_CITIES } from "@/lib/russian-cities";
import { HOUSING_TYPES } from "@noble-peak/shared";
import type { HousingType, ListingRecord } from "@noble-peak/shared";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface HousingAiAssistantProps {
  listings: ListingRecord[];
  initialCity?: string;
}

type QuestionStep = "greeting" | "type" | "city" | "guests" | "budget" | "done";

const ASSISTANT_NAME = "ИИ-ассистент по жилью";

const GREETING_MESSAGE =
  "Привет! Я ИИ-ассистент и помогу подобрать жильё для вашей поездки. Какой тип жилья вас интересует?";

const CITY_QUESTION =
  "В каком городе ищете жильё? Если город не важен, напишите «не важно».";

const GUESTS_QUESTION = "Сколько человек планирует заехать?";

const BUDGET_QUESTION =
  "Какой бюджет за ночь? Например: до 3000 ₽, 3000–6000 ₽, более 10000 ₽ или «не важно».";

const TYPE_SUGGESTIONS = HOUSING_TYPES.map((t) => t.label);

const GUESTS_SUGGESTIONS = ["1", "2", "3", "4", "5", "не важно"];

const BUDGET_SUGGESTIONS = [
  "до 3000 ₽",
  "3000–6000 ₽",
  "6000–10000 ₽",
  "более 10000 ₽",
  "не важно",
];

function matchHousingType(
  text: string
): { type: HousingType; label: string } | null {
  const lower = text.toLowerCase();
  for (const t of HOUSING_TYPES) {
    if (lower.includes(t.label.toLowerCase().split(" ")[0]))
      return { type: t.value, label: t.label };
  }
  const keywordMap: Record<string, HousingType> = {
    номер: "rooms",
    отель: "rooms",
    гостиница: "rooms",
    хостел: "rooms",
    квартир: "apartments",
    апартамент: "apartments",
    студи: "apartments",
    дом: "houses",
    коттедж: "houses",
    дача: "houses",
    вилл: "houses",
    таунхаус: "houses",
    комнат: "separate_rooms",
  };
  for (const [word, type] of Object.entries(keywordMap)) {
    if (lower.includes(word)) {
      const def = HOUSING_TYPES.find((t) => t.value === type)!;
      return { type, label: def.label };
    }
  }
  return null;
}

function matchCity(text: string, currentCity?: string): string | null {
  if (text.toLowerCase().includes("не важно")) return null;
  const lower = text.toLowerCase();
  const sorted = [...RUSSIAN_CITIES].sort((a, b) => b.length - a.length);
  for (const city of sorted) {
    if (lower.includes(city.toLowerCase())) return city;
  }
  if (currentCity && RUSSIAN_CITIES.includes(currentCity)) return currentCity;
  return null;
}

function parseBudget(text: string): { min?: number; max?: number } {
  const t = text.toLowerCase().replace(/\s/g, "");
  if (t.includes("до")) {
    const m = t.match(/(\d+)/);
    if (m) return { max: parseInt(m[1]) };
  }
  if (t.includes("более") || t.includes("больше") || t.includes("от")) {
    const m = t.match(/(\d+)/);
    if (m) return { min: parseInt(m[1]) };
  }
  const range = t.match(/(\d+)\s*[-–—]\s*(\d+)/);
  if (range) {
    return { min: parseInt(range[1]), max: parseInt(range[2]) };
  }
  return {};
}

function parseGuests(text: string): number | undefined {
  const lower = text.toLowerCase();
  if (lower.includes("не важно")) return undefined;
  const m = lower.match(/(\d+)/);
  if (!m) return undefined;
  const n = parseInt(m[1]);
  return n > 0 ? n : undefined;
}

function filterListings(
  listings: ListingRecord[],
  opts: {
    type?: HousingType | null;
    city?: string | null;
    guests?: number;
    budget?: { min?: number; max?: number };
  }
): ListingRecord[] {
  return listings.filter((l) => {
    if (opts.type && l.housingType !== opts.type) return false;
    if (opts.city && l.city !== opts.city) return false;
    if (opts.guests !== undefined && l.guests < opts.guests) return false;
    if (opts.budget?.min !== undefined && l.price < opts.budget.min)
      return false;
    if (opts.budget?.max !== undefined && l.price > opts.budget.max)
      return false;
    return true;
  });
}

export function HousingAiAssistant({
  listings,
  initialCity,
}: HousingAiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: GREETING_MESSAGE },
  ]);
  const [step, setStep] = useState<QuestionStep>("greeting");
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [typeAnswer, setTypeAnswer] = useState<HousingType | null>(null);
  const [cityAnswer, setCityAnswer] = useState<string | null>(
    initialCity ?? null
  );
  const [guestsAnswer, setGuestsAnswer] = useState<number | undefined>();
  const [budgetText, setBudgetText] = useState("");
  const [results, setResults] = useState<ListingRecord[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchingRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role: "assistant" | "user", content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  const askQuestion = (question: string) => {
    setTimeout(() => addMessage("assistant", question), 400);
  };

  const finishSearch = (
    type: HousingType | null,
    city: string | null,
    guests: number | undefined,
    budgetTextRaw: string
  ) => {
    const found = filterListings(listings, {
      type,
      city,
      guests,
      budget: parseBudget(budgetTextRaw),
    });
    setResults(found);
    setShowResults(true);
    setSearchError(false);
    if (found.length === 0) {
      addMessage(
        "assistant",
        "К сожалению, по вашим критериям ничего не найдено. Попробуйте изменить запрос."
      );
    } else {
      addMessage(
        "assistant",
        `Отлично! Я нашёл ${found.length} ${
          found.length === 1 ? "объявление" : "объявлений"
        }, которые могут вам подойти:`
      );
    }
    searchingRef.current = false;
  };

  const processAnswer = (text: string) => {
    addMessage("user", text);
    setIsProcessing(true);

    setTimeout(() => {
      switch (step) {
        case "greeting":
        case "type": {
          const matched = matchHousingType(text);
          setTypeAnswer(matched?.type ?? null);
          setIsProcessing(false);
          if (cityAnswer) {
            setStep("guests");
            askQuestion(GUESTS_QUESTION);
          } else {
            setStep("city");
            askQuestion(CITY_QUESTION);
          }
          break;
        }
        case "city": {
          const detected = matchCity(text, initialCity);
          setCityAnswer(detected);
          setIsProcessing(false);
          setStep("guests");
          askQuestion(GUESTS_QUESTION);
          break;
        }
        case "guests": {
          setGuestsAnswer(parseGuests(text));
          setIsProcessing(false);
          setStep("budget");
          askQuestion(BUDGET_QUESTION);
          break;
        }
        case "budget": {
          setBudgetText(text);
          setStep("done");
          setIsProcessing(false);
          searchingRef.current = true;
          finishSearch(typeAnswer, cityAnswer, guestsAnswer, text);
          break;
        }
      }
    }, 600);
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isProcessing || searchingRef.current) return;
    setInputValue("");
    processAnswer(text);
  };

  const handleSuggestionClick = (value: string) => {
    if (isProcessing || searchingRef.current) return;
    setInputValue("");
    processAnswer(value);
  };

  const resetDialog = () => {
    setStep("greeting");
    setTypeAnswer(null);
    setCityAnswer(initialCity ?? null);
    setGuestsAnswer(undefined);
    setBudgetText("");
    setResults([]);
    setShowResults(false);
    setSearchError(false);
    setMessages([{ role: "assistant", content: GREETING_MESSAGE }]);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{ASSISTANT_NAME}</p>
            <p className="text-xs text-muted-foreground">
              {step === "done" ? "Поиск завершён" : "Задаёт уточняющие вопросы"}
            </p>
          </div>
          {step !== "greeting" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={resetDialog}
            >
              Начать заново
            </Button>
          )}
        </div>

        <div className="max-h-[50vh] space-y-3 overflow-y-auto px-4 py-4 sm:max-h-[360px]">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300 sm:max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" && i === 0 && (
                  <Sparkles className="mb-1 h-3.5 w-3.5 text-primary" />
                )}
                {msg.content}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-muted-foreground">Думаю...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {step !== "done" && (
          <div className="border-t p-4">
            {(step === "type" ||
              step === "city" ||
              step === "guests" ||
              step === "budget") && (
              <div className="mb-3">
                {step === "type" && (
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    {TYPE_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSuggestionClick(s)}
                        className="min-h-[48px] rounded-xl bg-muted px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/80 active:bg-muted/60 sm:min-h-[44px] sm:px-4 sm:py-3"
                      >
                        {s}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => inputRef.current?.focus()}
                      className="col-span-2 min-h-[48px] rounded-xl border border-dashed border-muted-foreground/30 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 sm:col-auto sm:min-h-[44px] sm:px-4 sm:py-3"
                    >
                      Опишите своими словами
                    </button>
                  </div>
                )}
                {step === "city" && (
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    {[initialCity, "Москва", "Сочи", "Ялта"]
                      .filter(Boolean)
                      .filter((c, i, arr) => arr.indexOf(c as string) === i)
                      .map((s) => (
                        <button
                          key={s as string}
                          type="button"
                          onClick={() => handleSuggestionClick(s as string)}
                          className="flex min-h-[48px] items-center justify-center gap-1 rounded-xl bg-muted px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/80 active:bg-muted/60 sm:min-h-[44px] sm:px-4 sm:py-3"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          {s as string}
                        </button>
                      ))}
                    <button
                      type="button"
                      onClick={() => handleSuggestionClick("не важно")}
                      className="flex min-h-[48px] items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 sm:min-h-[44px] sm:px-4 sm:py-3"
                    >
                      Не важно
                    </button>
                  </div>
                )}
                {step === "guests" && (
                  <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                    {GUESTS_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSuggestionClick(s)}
                        className="flex min-h-[48px] items-center justify-center gap-1 rounded-xl bg-muted px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/80 active:bg-muted/60 sm:min-h-[44px] sm:px-4 sm:py-3"
                      >
                        {s !== "не важно" && <Users className="h-3.5 w-3.5" />}
                        {s === "не важно" ? s : `${s} гостя`}
                      </button>
                    ))}
                  </div>
                )}
                {step === "budget" && (
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    {BUDGET_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSuggestionClick(s)}
                        className="min-h-[48px] rounded-xl bg-muted px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/80 active:bg-muted/60 sm:min-h-[44px] sm:px-4 sm:py-3"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  placeholder={
                    step === "greeting" || step === "type"
                      ? "Например: квартира у моря..."
                      : step === "city"
                        ? "Например: Сочи, Ялта..."
                        : step === "guests"
                          ? "Например: 2, 4..."
                          : "Например: до 5000 ₽..."
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Button type="submit" size="icon" disabled={!inputValue.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}

        {step === "done" && (
          <div className="border-t p-4">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={resetDialog}
            >
              <Search className="h-4 w-4" />
              Новый поиск
            </Button>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && !searchError && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Search className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              Рекомендации ассистента
            </h2>
            <span className="text-sm text-muted-foreground">
              {results.length}{" "}
              {results.length === 1 ? "объявление" : "объявлений"}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}

      {showResults && results.length === 0 && !searchError && (
        <div className="flex flex-col items-center gap-3 py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Ничего не найдено. Попробуйте изменить критерии поиска.
          </p>
          <Button variant="outline" size="sm" onClick={resetDialog}>
            Начать заново
          </Button>
        </div>
      )}

      {showResults && searchError && (
        <div className="flex flex-col items-center gap-3 py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Произошла ошибка при поиске. Пожалуйста, попробуйте ещё раз.
          </p>
          <Button variant="outline" size="sm" onClick={resetDialog}>
            Начать заново
          </Button>
        </div>
      )}
    </div>
  );
}
