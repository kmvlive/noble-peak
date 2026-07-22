"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActivityCard } from "@/components/activity-card";
import type { ActivityRecord } from "@/lib/models";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface SearchAiAssistantProps {
  activities: ActivityRecord[];
  sectionNameMap: Record<string, string>;
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

function filterActivities(
  activities: ActivityRecord[],
  sectionNameMap: Record<string, string>,
  typeAnswer: string,
  cityAnswer: string,
  budgetAnswer: string
): ActivityRecord[] {
  const typeLower = typeAnswer.toLowerCase();
  const cityLower = cityAnswer.toLowerCase();
  const budgetResult = parseBudget(budgetAnswer);
  const cityRelevant =
    cityLower !== "" &&
    !cityLower.includes("не важно") &&
    !cityLower.includes("неважн");

  return activities.filter((a) => {
    const sectionName = (sectionNameMap[a.section] || a.section).toLowerCase();
    const titleLower = a.title.toLowerCase();
    const shortDesc = a.shortDescription.toLowerCase();
    const location = (a.location || "").toLowerCase();
    const fullText = `${titleLower} ${shortDesc} ${sectionName} ${location}`;

    let typeMatch = true;
    if (
      typeLower &&
      !typeLower.includes("не важно") &&
      !typeLower.includes("неважн")
    ) {
      typeMatch =
        fullText.includes(typeLower) ||
        sectionName.includes(typeLower) ||
        typeLower
          .split(" ")
          .some((word) => word.length > 2 && fullText.includes(word));
    }

    let cityMatch = true;
    if (cityRelevant) {
      cityMatch =
        location.includes(cityLower) ||
        cityLower
          .split(" ")
          .some((word) => word.length > 2 && location.includes(word));
    }

    let budgetMatch = true;
    if (budgetResult.min !== undefined || budgetResult.max !== undefined) {
      if (budgetResult.min !== undefined && budgetResult.max !== undefined) {
        budgetMatch =
          a.price >= budgetResult.min && a.price <= budgetResult.max;
      } else if (budgetResult.min !== undefined) {
        budgetMatch = a.price >= budgetResult.min;
      } else if (budgetResult.max !== undefined) {
        budgetMatch = a.price <= budgetResult.max;
      }
    }

    return typeMatch && cityMatch && budgetMatch;
  });
}

export function SearchAiAssistant({
  activities,
  sectionNameMap,
  initialQuery,
}: SearchAiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: GREETING_MESSAGE },
  ]);
  const [step, setStep] = useState<QuestionStep>("greeting");
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [typeAnswer, setTypeAnswer] = useState("");
  const [cityAnswer, setCityAnswer] = useState("");
  const [results, setResults] = useState<ActivityRecord[]>([]);
  const [showResults, setShowResults] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedInitialRef = useRef(false);

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
    if (initialQuery && !processedInitialRef.current) {
      processedInitialRef.current = true;
      const timer = setTimeout(() => {
        addMessage("user", initialQuery);
        setIsProcessing(true);
        setTimeout(() => {
          setStep("type");
          setTypeAnswer(initialQuery);
          setIsProcessing(false);
          askQuestion(TYPE_QUESTION);
        }, 600);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [initialQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isProcessing) return;

    setInputValue("");
    addMessage("user", text);
    setIsProcessing(true);

    setTimeout(() => {
      switch (step) {
        case "greeting":
          setStep("type");
          setTypeAnswer(text);
          setIsProcessing(false);
          askQuestion(TYPE_QUESTION);
          break;
        case "type":
          setStep("city");
          setTypeAnswer(text);
          setIsProcessing(false);
          askQuestion(CITY_QUESTION);
          break;
        case "city":
          setStep("budget");
          setCityAnswer(text);
          setIsProcessing(false);
          askQuestion(BUDGET_QUESTION);
          break;
        case "budget":
          setStep("done");
          setIsProcessing(false);

          const filtered = filterActivities(
            activities,
            sectionNameMap,
            typeAnswer || text,
            cityAnswer || text,
            text
          );

          setResults(filtered);
          setShowResults(true);

          if (filtered.length === 0) {
            addMessage(
              "assistant",
              "К сожалению, по вашему запросу ничего не найдено. Попробуйте изменить критерии поиска."
            );
          } else {
            addMessage(
              "assistant",
              `Отлично! Я нашёл ${filtered.length} ${
                filtered.length === 1 ? "активность" : "активностей"
              }, которые могут вам подойти:`
            );
          }
          break;
      }
    }, 600);
  };

  const resetDialog = () => {
    setStep("greeting");
    setTypeAnswer("");
    setCityAnswer("");
    setResults([]);
    setShowResults(false);
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
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
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1"
              />
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

      {showResults && results.length > 0 && (
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

      {showResults && results.length === 0 && (
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
    </div>
  );
}
