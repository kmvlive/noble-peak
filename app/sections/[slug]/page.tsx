import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, ChevronLeft, MapPin, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SectionRecord, ActivityRecord } from "@/lib/models";

export const revalidate = 60;

export default async function SectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const baseUrl = process.env.BASE_URL || "http://localhost:8080";

  const [sectionsRes, activitiesRes] = await Promise.all([
    fetch(`${baseUrl}/api/sections`, {
      next: { revalidate: 60, tags: ["sections"] },
    }),
    fetch(`${baseUrl}/api/activities`, {
      next: { revalidate: 60, tags: ["activities"] },
    }),
  ]);

  const sections: SectionRecord[] = await sectionsRes.json();
  const activities: ActivityRecord[] = await activitiesRes.json();

  const section = sections.find((s) => s.id === slug);
  if (!section) notFound();

  const categoryActivities = activities.filter(
    (a) => a.section === section.category
  );

  const filteredByCategory = activities.filter(
    (a) => a.section === section.category
  );
  const filteredById = activities.filter((a) => a.section === section.id);
  const filteredByName = activities.filter((a) => a.section === section.name);

  const debugInfo = {
    slug,
    section: { id: section.id, name: section.name, category: section.category },
    sectionsCount: sections.length,
    activitiesCount: activities.length,
    activeActivitiesCount: activities.filter((a) => a.status === "active")
      .length,
    categoryActivitiesCount: categoryActivities.length,
    filteredByCategoryCount: filteredByCategory.length,
    filteredByIdCount: filteredById.length,
    filteredByNameCount: filteredByName.length,
    allActivities: activities.map((a) => ({
      id: a.id,
      title: a.title,
      section: a.section,
      status: a.status,
    })),
    allSections: sections.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
    })),
  };

  const isDebug = process.env.NODE_ENV === "development";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        На главную
      </Link>

      <div className="mb-8 space-y-2">
        <div
          className={`flex h-24 sm:h-32 items-center justify-center rounded-xl bg-gradient-to-br ${section.imageGradient} mb-4`}
        >
          <Compass className="h-10 w-10 text-white/70 sm:h-14 sm:w-14" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {section.name}
        </h1>
        <p className="text-muted-foreground">{section.description}</p>
        <p className="text-sm text-muted-foreground">
          {categoryActivities.length}{" "}
          {categoryActivities.length === 1 ? "активность" : "активностей"}
        </p>
      </div>

      {categoryActivities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Compass className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">
            В этом разделе пока нет активностей
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Скоро здесь появятся новые приключения
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoryActivities.map((activity) => {
            const firstImage = activity.images?.[0];
            const hasRealImage =
              firstImage &&
              (firstImage.startsWith("http") ||
                firstImage.startsWith("/uploads/"));

            return (
              <Link key={activity.id} href={`/activities/${activity.id}`}>
                <Card className="h-full card-hover">
                  {hasRealImage ? (
                    <div className="h-28 overflow-hidden rounded-t-lg">
                      <img
                        src={firstImage!}
                        alt={activity.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={`flex h-28 items-center justify-center bg-gradient-to-br ${activity.imageGradient}`}
                    >
                      <Compass className="h-8 w-8 text-white/70" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        <MapPin className="mr-0.5 h-3 w-3" />
                        {section.name}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Heart className="h-3 w-3" />
                        {activity.likes}
                      </span>
                    </div>
                    <CardTitle className="mt-1 text-base">
                      {activity.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {activity.shortDescription}
                    </p>
                    <p className="mt-3 text-lg font-semibold text-primary">
                      {activity.price.toLocaleString("ru-RU")} ₽
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      {isDebug && (
        <details className="mt-8 rounded-lg border border-dashed border-amber-400 bg-amber-50 p-4 text-xs font-mono">
          <summary className="cursor-pointer font-semibold text-amber-800">
            Debug: данные страницы раздела
          </summary>
          <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
