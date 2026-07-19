import Link from "next/link";
import {
  Heart,
  Star,
  Compass,
  Waves,
  Mountain,
  UtensilsCrossed,
  Bike,
  Gamepad2,
  Zap,
  Map as MapIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityRecord, SectionRecord } from "@/lib/models";

const sectionIcons: Record<string, React.ReactNode> = {
  Waves: <Waves className="h-6 w-6" />,
  Mountain: <Mountain className="h-6 w-6" />,
  UtensilsCrossed: <UtensilsCrossed className="h-6 w-6" />,
  Bike: <Bike className="h-6 w-6" />,
  Map: <MapIcon className="h-6 w-6" />,
  Gamepad2: <Gamepad2 className="h-6 w-6" />,
  Zap: <Zap className="h-6 w-6" />,
};

function SectionCard({
  section,
  activityCount,
  randomImage,
}: {
  section: SectionRecord;
  activityCount: number;
  randomImage: string | null;
}) {
  const hasRealImage =
    randomImage &&
    (randomImage.startsWith("http") || randomImage.startsWith("/uploads/"));

  return (
    <Link href={`/sections/${section.id}`}>
      <Card className="min-w-[180px] snap-start card-hover">
        {hasRealImage ? (
          <div>
            <img
              src={randomImage!}
              alt={section.name}
              className="w-full rounded-t-lg"
            />
          </div>
        ) : (
          <div
            className={`flex aspect-video items-center justify-center rounded-t-lg bg-gradient-to-br ${section.imageGradient}`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm">
              {sectionIcons[section.icon] || (
                <Compass className="h-6 w-6 text-white" />
              )}
            </div>
          </div>
        )}
        <CardHeader className="p-3">
          <CardTitle className="text-sm">{section.name}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-xs text-muted-foreground">
            {activityCount} {activityCount === 1 ? "активность" : "активностей"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function ActivityCard({
  _id,
  title,
  shortDescription,
  category,
  price,
  imageGradient,
  likes,
  images,
}: {
  _id: string;
  title: string;
  shortDescription: string;
  category: string;
  price: number;
  imageGradient: string;
  likes: number;
  images: string[];
}) {
  const firstImage = images?.[0];
  const hasRealImage =
    firstImage &&
    (firstImage.startsWith("http") || firstImage.startsWith("/uploads/"));

  return (
    <Link href={`/activities/${_id}`}>
      <Card className="min-w-[260px] snap-start card-hover">
        {hasRealImage ? (
          <div>
            <img src={firstImage} alt={title} className="w-full rounded-t-lg" />
          </div>
        ) : (
          <div
            className={`flex aspect-video items-center justify-center bg-gradient-to-br ${imageGradient}`}
          >
            <Compass className="h-10 w-10 text-white/80" />
          </div>
        )}
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              <MapIcon className="mr-0.5 h-3 w-3" />
              {category}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="h-3 w-3" />
              {likes}
            </span>
          </div>
          <CardTitle className="mt-1">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {shortDescription}
          </p>
          <p className="mt-3 text-lg font-semibold text-primary">
            {price.toLocaleString("ru-RU")} ₽
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function ActivitySection({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof Star;
  items: (ActivityRecord & { sectionName: string })[];
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none">
        {items.map(({ id, sectionName, ...rest }) => (
          <ActivityCard key={id} _id={id} category={sectionName} {...rest} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const baseUrl = process.env.BASE_URL || "http://localhost:8080";

  const [activitiesRes, sectionsRes] = await Promise.all([
    fetch(`${baseUrl}/api/activities`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/sections`, { cache: "no-store" }),
  ]);

  const activities: ActivityRecord[] = await activitiesRes.json();
  const sections: SectionRecord[] = await sectionsRes.json();

  const sectionNameMap = new Map<string, string>();
  for (const s of sections) {
    sectionNameMap.set(s.category, s.name);
  }

  const activityCountBySection = new Map<string, number>();
  for (const a of activities) {
    activityCountBySection.set(
      a.section,
      (activityCountBySection.get(a.section) || 0) + 1
    );
  }

  const sectionPhotosMap = new Map<string, string[]>();
  for (const a of activities) {
    const validImages = (a.images || []).filter(
      (img) => img.startsWith("http") || img.startsWith("/uploads/")
    );
    if (validImages.length > 0) {
      const existing = sectionPhotosMap.get(a.section) || [];
      sectionPhotosMap.set(a.section, [...existing, ...validImages]);
    }
  }

  const sectionRandomPhoto = new Map<string, string | null>();
  for (const [sectionId, photos] of sectionPhotosMap) {
    let randomPhoto: string | null = null;
    if (photos.length > 0) {
      // eslint-disable-next-line react-hooks/purity
      randomPhoto = photos[Math.floor(Math.random() * photos.length)];
    }
    sectionRandomPhoto.set(sectionId, randomPhoto);
  }

  const latest = [...activities]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map((a) => ({
      ...a,
      sectionName: sectionNameMap.get(a.section) || a.section,
    }));

  const popular = activities
    .filter((a) => a.isPopular)
    .map((a) => ({
      ...a,
      sectionName: sectionNameMap.get(a.section) || a.section,
    }));

  return (
    <div className="min-h-[calc(100vh-9rem)]">
      <section className="gradient-hero-vibrant px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl space-y-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm">
            <Compass className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Найдите приключение по душе
          </h1>
          <p className="mx-auto max-w-xl text-base text-muted-foreground">
            Трекинг, сплавы, дегустации, квесты и ещё 100+ активностей —
            выбирайте и бронируйте онлайн
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:py-12">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <MapIcon className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">Разделы</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none">
            {sections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                activityCount={
                  activityCountBySection.get(section.category) || 0
                }
                randomImage={sectionRandomPhoto.get(section.category) ?? null}
              />
            ))}
          </div>
        </section>

        <ActivitySection
          title="Последние активности"
          icon={Star}
          items={latest}
        />

        <ActivitySection
          title="Популярные активности"
          icon={Heart}
          items={popular}
        />
      </div>
    </div>
  );
}
