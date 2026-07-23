"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActivityCard } from "@/components/activity-card";
import { SearchSuggestions } from "@/components/search-suggestions";
import type { ActivityRecord } from "@/lib/models";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface SearchAiAssistantProps {
  initialQuery?: string;
}

type QuestionStep = "greeting" | "type" | "city" | "budget" | "done";

const ASSISTANT_NAME = "ИИ-ассистент";

const GREETING_MESSAGE =
  "Привет! Я ИИ-ассистент. Помогу подобрать идеальную активность. Расскажите, что вас интересует?";

const TYPE_QUESTION =
  "Какой тип активности вам интересен? Например: водные, треккинг, гастрономия, экскурсии, активный отдых, развлечения, экстрим. Или опишите своими словами.";

const CITY_QUESTION =
  "В каком городе или месте ищете активность? Если город не важен, напишите «не важно».";

const BUDGET_QUESTION =
  "Какой бюджет на человека? Например: до 2000 ₽, 3000-5000 ₽, более 10000 ₽ или «не важно».";

const KNOWN_CITIES = [
  "москва",
  "санкт-петербург",
  "питер",
  "спб",
  "казань",
  "сочи",
  "екатеринбург",
  "новосибирск",
  "нижний новгород",
  "краснодар",
  "ростов-на-дону",
  "самара",
  "уфа",
  "красноярск",
  "пермь",
  "воронеж",
  "волгоград",
  "ялта",
  "севастополь",
  "балаклава",
  "симферополь",
  "алушта",
  "евпатория",
  "феодосия",
  "судак",
  "коктебель",
  "пятигорск",
  "кисловодск",
  "железноводск",
  "ессентуки",
  "минводы",
  "ставрополь",
  "нальчик",
  "майкоп",
  "черкесск",
  "анапа",
  "геленджик",
  "новороссийск",
  "туапсе",
  "адлер",
  "архыз",
  "домбай",
  "теберда",
  "приэльбрусье",
  "астрахань",
  "саратов",
  "белгород",
  "калининград",
  "тула",
  "ярославль",
  "владимир",
  "рязань",
  "липецк",
  "тамбов",
  "петрозаводск",
  "мурманск",
  "архангельск",
  "псков",
  "смоленск",
  "тверь",
  "калуга",
  "кострома",
  "иваново",
  "киров",
  "чебоксары",
  "ижевск",
  "ульяновск",
  "саранск",
  "пенза",
  "оренбург",
  "тольятти",
  "тюмень",
  "сургут",
  "челябинск",
  "магнитогорск",
  "нижний тагил",
  "курган",
  "омск",
  "томск",
  "кемерово",
  "новокузнецк",
  "барнаул",
  "иркутск",
  "братск",
  "улан-удэ",
  "чита",
  "владивосток",
  "хабаровск",
  "благовещенск",
  "петропавловск-камчатский",
  "магадан",
  "южно-сахалинск",
  "набережные челны",
  "дмитров",
  "сергиев посад",
  "коломна",
  "звенигород",
  "переславль-залесский",
  "суздаль",
  "владикавказ",
  "грозный",
  "махачкала",
  "дербент",
  "назрань",
  "элиста",
];

const ACTIVITY_TYPE_GROUPS: { keywords: string[]; type: string }[] = [
  {
    keywords: [
      "водные",
      "дайвинг",
      "рафтинг",
      "сплав",
      "яхта",
      "катер",
      "снорклинг",
      "серфинг",
      "каяк",
    ],
    type: "водные",
  },
  {
    keywords: ["треккинг", "поход", "восхождение", "горный", "пеший", "тропа"],
    type: "треккинг",
  },
  {
    keywords: [
      "гастрономия",
      "дегустация",
      "вино",
      "еда",
      "кулинарный",
      "ресторан",
    ],
    type: "гастрономия",
  },
  {
    keywords: ["экскурсия", "экскурсии", "тур", "обзорный", "гид"],
    type: "экскурсии",
  },
  {
    keywords: ["активный отдых", "спорт", "вело", "велосипед", "бег"],
    type: "активный отдых",
  },
  {
    keywords: [
      "развлечения",
      "квест",
      "мастер-класс",
      "игра",
      "аттракцион",
      "кёрлинг",
      "керлинг",
      "боулинг",
      "караоке",
      "кино",
    ],
    type: "развлечения",
  },
  {
    keywords: [
      "экстрим",
      "экстремальный",
      "прыжок",
      "скалолазание",
      "зиплайн",
      "роуп",
      "банджи",
    ],
    type: "экстрим",
  },
];

const COMMON_NON_CITY_WORDS = new Set([
  "поиске",
  "интересует",
  "активности",
  "активность",
  "развлечения",
  "отдых",
  "поход",
  "экскурсии",
  "экскурсия",
  "водные",
  "треккинг",
  "гастрономия",
  "экстрим",
  "спорт",
  "горный",
  "пеший",
  "трофа",
  "ресторан",
  "квест",
  "игра",
  "кино",
  "тур",
  "гид",
]);

function extractCity(text: string): string | null {
  const lower = text.toLowerCase();

  const sortedByLength = [...KNOWN_CITIES].sort((a, b) => b.length - a.length);
  for (const city of sortedByLength) {
    if (lower.includes(city)) return city;
  }

  const words = lower.split(/[\s,]+/).filter((w) => w.length > 2);

  for (const word of words) {
    if (
      (word.endsWith("ск") ||
        word.endsWith("град") ||
        word.endsWith("бург") ||
        word.endsWith("поль") ||
        word.endsWith("горск") ||
        word.endsWith("цк")) &&
      !COMMON_NON_CITY_WORDS.has(word)
    ) {
      return word;
    }
  }

  const LOCATION_PREPOSITIONS = ["в", "во", "на", "из", "под"];
  for (let i = 1; i < words.length; i++) {
    if (
      LOCATION_PREPOSITIONS.includes(words[i - 1]) &&
      words[i].length > 3 &&
      !COMMON_NON_CITY_WORDS.has(words[i])
    ) {
      return words[i];
    }
  }

  return null;
}

function findActivityType(text: string): string | null {
  const lower = text.toLowerCase();
  for (const group of ACTIVITY_TYPE_GROUPS) {
    for (const keyword of group.keywords) {
      if (lower.includes(keyword)) return group.type;
    }
  }
  return null;
}

interface SearchResponse {
  activities: ActivityRecord[];
  sectionNameMap: Record<string, string>;
}

function parseBudget(budgetText: string): { min?: number; max?: number } {
  const text = budgetText.toLowerCase().replace(/\s/g, "");
  if (text.includes("до")) {
    const match = text.match(/(\d+)/);
    if (match) return { max: parseInt(match[1]) };
  }
  if (
    text.includes("более") ||
    text.includes("больше") ||
    text.includes("от")
  ) {
    const match = text.match(/(\d+)/);
    if (match) return { min: parseInt(match[1]) };
  }
  const rangeMatch = text.match(/(\d+)\s*[-–—]\s*(\d+)/);
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) };
  }
  const singleMatch = text.match(/(\d+)/);
  if (singleMatch) {
    const val = parseInt(singleMatch[1]);
    return { min: val * 0.5, max: val * 1.5 };
  }
  return {};
}

async function searchActivities(params: {
  q: string;
  city: string;
  budgetText: string;
}): Promise<SearchResponse> {
  const url = new URL("/api/activities/search", window.location.origin);
  if (params.q) url.searchParams.set("q", params.q);
  if (params.city) url.searchParams.set("city", params.city);

  const budgetResult = parseBudget(params.budgetText);
  if (budgetResult.min !== undefined) {
    url.searchParams.set("budget_min", String(budgetResult.min));
  }
  if (budgetResult.max !== undefined) {
    url.searchParams.set("budget_max", String(budgetResult.max));
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Ошибка поиска");
  }
  return res.json();
}

export function SearchAiAssistant({ initialQuery }: SearchAiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: GREETING_MESSAGE },
  ]);
  const [step, setStep] = useState<QuestionStep>("greeting");
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [typeAnswer, setTypeAnswer] = useState("");
  const [cityAnswer, setCityAnswer] = useState("");
  const [results, setResults] = useState<ActivityRecord[]>([]);
  const [sectionNameMap, setSectionNameMap] = useState<Record<string, string>>(
    {}
  );
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSearchingRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role: "assistant" | "user", content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  const askQuestion = (question: string) => {
    setTimeout(() => {
      addMessage("assistant", question);
    }, 400);
  };

  useEffect(() => {
    if (!initialQuery) return;

    const timer = setTimeout(() => {
      setMessages([
        { role: "assistant", content: GREETING_MESSAGE },
        { role: "user", content: initialQuery },
      ]);
      setIsProcessing(true);
      setStep("greeting");
      setTypeAnswer("");
      setCityAnswer("");
      setResults([]);
      setShowResults(false);
      setSearchError(false);

      setTimeout(() => {
        const detectedType = findActivityType(initialQuery);
        const detectedCity = extractCity(initialQuery);

        if (detectedType && detectedCity) {
          setTypeAnswer(detectedType);
          setCityAnswer(detectedCity);
          setStep("budget");
          setIsProcessing(false);
          askQuestion(BUDGET_QUESTION);
        } else if (detectedType) {
          setTypeAnswer(detectedType);
          setStep("city");
          setIsProcessing(false);
          askQuestion(CITY_QUESTION);
        } else if (detectedCity) {
          setCityAnswer(detectedCity);
          setStep("type");
          setIsProcessing(false);
          askQuestion(TYPE_QUESTION);
        } else {
          setTypeAnswer(initialQuery);
          setStep("type");
          setIsProcessing(false);
          askQuestion(TYPE_QUESTION);
        }
      }, 600);
    }, 800);
    return () => clearTimeout(timer);
  }, [initialQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const processAnswer = (text: string) => {
    addMessage("user", text);
    setIsProcessing(true);

    setTimeout(() => {
      switch (step) {
        case "greeting": {
          const greetingCity = extractCity(text);
          if (greetingCity) {
            setCityAnswer(greetingCity);
          }
          setStep("type");
          setTypeAnswer(text);
          setIsProcessing(false);
          askQuestion(TYPE_QUESTION);
          break;
        }
        case "type":
          setTypeAnswer(text);
          setIsProcessing(false);
          if (cityAnswer) {
            setStep("budget");
            askQuestion(BUDGET_QUESTION);
          } else {
            setStep("city");
            askQuestion(CITY_QUESTION);
          }
          break;
        case "city":
          setStep("budget");
          setCityAnswer(text);
          setIsProcessing(false);
          askQuestion(BUDGET_QUESTION);
          break;
        case "budget": {
          setStep("done");
          setIsProcessing(false);

          const resolvedType = (typeAnswer || "").trim();
          const resolvedCity = (cityAnswer || "").trim();
          const resolvedInitial = (initialQuery || "").trim();

          const qParts = [resolvedInitial, resolvedType].filter(Boolean);
          const qParam = qParts.join(" ");

          isSearchingRef.current = true;

          searchActivities({
            q: qParam,
            city: resolvedCity,
            budgetText: text,
          })
            .then((response) => {
              setResults(response.activities);
              setSectionNameMap(response.sectionNameMap);
              setShowResults(true);
              setSearchError(false);

              if (response.activities.length === 0) {
                addMessage(
                  "assistant",
                  "К сожалению, по вашему запросу ничего не найдено. Попробуйте изменить критерии поиска."
                );
              } else {
                addMessage(
                  "assistant",
                  `Отлично! Я нашёл ${response.activities.length} ${
                    response.activities.length === 1
                      ? "активность"
                      : "активностей"
                  }, которые могут вам подойти:`
                );
              }
            })
            .catch(() => {
              setSearchError(true);
              setShowResults(true);
              addMessage(
                "assistant",
                "Произошла ошибка при поиске. Пожалуйста, попробуйте ещё раз."
              );
            })
            .finally(() => {
              isSearchingRef.current = false;
            });

          break;
        }
      }
    }, 600);
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isProcessing || isSearchingRef.current) return;

    setInputValue("");
    processAnswer(text);
  };

  const handleSuggestionClick = (value: string) => {
    if (isProcessing || isSearchingRef.current) return;

    setInputValue("");
    processAnswer(value);
  };

  const ACTIVITY_TYPE_SUGGESTIONS = [
    "Пеший туризм",
    "Водные",
    "Треккинг",
    "Гастрономия",
    "Экскурсии",
    "Активный отдых",
    "Развлечения",
    "Экстрим",
  ];

  const BUDGET_SUGGESTIONS = [
    "до 2000 ₽",
    "3000-5000 ₽",
    "более 10000 ₽",
    "не важно",
  ];

  const resetDialog = () => {
    setStep("greeting");
    setTypeAnswer("");
    setCityAnswer("");
    setResults([]);
    setSectionNameMap({});
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

        <div className="max-h-[360px] space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300 ${
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
            {(step === "type" || step === "budget") && (
              <div className="mb-3 flex flex-wrap gap-2">
                {step === "type" &&
                  ACTIVITY_TYPE_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSuggestionClick(s)}
                      className="min-h-[44px] rounded-xl bg-muted px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/80 active:bg-muted/60"
                    >
                      {s}
                    </button>
                  ))}
                {step === "type" && (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.focus()}
                    className="min-h-[44px] rounded-xl border border-dashed border-muted-foreground/30 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
                  >
                    Опишите своими словами
                  </button>
                )}
                {step === "budget" &&
                  BUDGET_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSuggestionClick(s)}
                      className="min-h-[44px] rounded-xl bg-muted px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/80 active:bg-muted/60"
                    >
                      {s}
                    </button>
                  ))}
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
                    step === "greeting"
                      ? "Напишите, что ищете..."
                      : step === "type"
                        ? "Например: водные, треккинг..."
                        : step === "city"
                          ? "Например: Москва, Сочи..."
                          : "Например: до 3000 ₽..."
                  }
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    if (e.target.value.trim().length >= 2) {
                      setShowSuggestions(true);
                    } else {
                      setShowSuggestions(false);
                    }
                  }}
                  onFocus={() => {
                    if (inputValue.trim().length >= 2) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="flex-1"
                />
                <SearchSuggestions
                  query={inputValue}
                  visible={showSuggestions}
                  onSelect={(value) => {
                    setInputValue(value);
                    setShowSuggestions(false);
                    setTimeout(() => handleSend(), 0);
                  }}
                  onClose={() => setShowSuggestions(false)}
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
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Search className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              Результаты поиска
            </h2>
            <span className="text-sm text-muted-foreground">
              {results.length}{" "}
              {results.length === 1 ? "активность" : "активностей"}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((a) => (
              <ActivityCard
                key={a.id}
                _id={a.id}
                title={a.title}
                shortDescription={a.shortDescription}
                category={sectionNameMap[a.section] || a.section}
                price={a.price}
                imageGradient={a.imageGradient}
                likes={a.likes}
                images={a.images}
              />
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
