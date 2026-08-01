import type { Metadata } from "next";
import { SearchAiAssistant } from "@/components/search-ai-assistant";

export const metadata: Metadata = {
  title: "Поиск с ИИ-ассистентом",
};

export default async function SearchPage(props: {
  searchParams?: Promise<{ q?: string; direct?: string }>;
}) {
  const searchParams = await props.searchParams;
  const initialQuery = searchParams?.q || "";
  const direct = searchParams?.direct === "1";

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:py-12">
      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
          Поиск с ИИ-ассистентом
        </h1>
        <p className="text-sm text-muted-foreground">
          Ответьте на несколько вопросов, и ассистент подберёт подходящие
          активности
        </p>
      </div>

      <SearchAiAssistant initialQuery={initialQuery} direct={direct} />
    </div>
  );
}
