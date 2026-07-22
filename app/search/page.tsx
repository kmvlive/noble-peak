import type { Metadata } from "next";
import { ActivityRecord, SectionRecord } from "@/lib/models";
import { SearchAiAssistant } from "@/components/search-ai-assistant";

export const metadata: Metadata = {
  title: "Поиск с ИИ-ассистентом",
};

export default async function SearchPage(props: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const initialQuery = searchParams?.q || "";

  const baseUrl = process.env.BASE_URL || "http://localhost:8080";

  const [activitiesRes, sectionsRes] = await Promise.all([
    fetch(`${baseUrl}/api/activities`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/sections`, { cache: "no-store" }),
  ]);

  const activities: ActivityRecord[] = await activitiesRes.json();
  const sections: SectionRecord[] = await sectionsRes.json();

  const sectionNameMap: Record<string, string> = {};
  for (const s of sections) {
    sectionNameMap[s.category] = s.name;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Поиск с ИИ-ассистентом
        </h1>
        <p className="text-sm text-muted-foreground">
          Ответьте на несколько вопросов, и ассистент подберёт подходящие
          активности
        </p>
      </div>

      <SearchAiAssistant
        activities={activities}
        sectionNameMap={sectionNameMap}
        initialQuery={initialQuery}
      />
    </div>
  );
}
