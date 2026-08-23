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
  MapPin,
  Map as MapIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityRecord, SectionRecord } from "@/lib/models";
import { ActivityCard } from "@/components/activity-card";
import { HeroSearch } from "@/components/hero-search";
import { HeroSlider } from "@/components/hero-slider";
import { slugToCityName, slugToRussian } from "@/lib/russian-cities";

export const dynamic = "force-dynamic";

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
      <Card className="card-hover h-full">
        {hasRealImage ? (
          <div className="bg-muted">
            <img
              src={randomImage!}
              alt={section.name}
              className="w-full rounded-t-lg max-h-32 object-contain"
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

function ActivitySection({
  title,
  icon: Icon,
  items,
  promoOutline = false,
}: {
  title: string;
  icon: typeof Star;
  items: (ActivityRecord & { sectionName: string })[];
  promoOutline?: boolean;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map(({ id, sectionName, ...rest }) => (
          <ActivityCard
            key={id}
            _id={id}
            category={sectionName}
            promoOutline={promoOutline}
            {...rest}
          />
        ))}
      </div>
    </section>
  );
}

function EmptyCityState({ cityName }: { cityName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <MapPin className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-lg font-medium">
        В этом городе пока нет активностей, но вы можете стать первым
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Зарегистрируйтесь как партнёр и разместите первую активность в городе{" "}
        {cityName}
      </p>
      <Link
        href="/partner/login"
        className="group/button mt-6 inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary px-4 text-sm font-medium whitespace-nowrap text-primary-foreground bg-clip-padding transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [a]:hover:bg-primary/80"
      >
        Стать партнёром
      </Link>
    </div>
  );
}

export default async function HomePage(props: {
  searchParams?: Promise<{ city?: string }>;
}) {
  const searchParams = await props.searchParams;
  const citySlug = searchParams?.city?.trim();
  const baseUrl = process.env.BASE_URL || "http://localhost:8080";

  const [activitiesRes, sectionsRes] = await Promise.all([
    fetch(`${baseUrl}/api/activities`, {
      next: { revalidate: 60, tags: ["activities"] },
    }),
    fetch(`${baseUrl}/api/sections`, {
      next: { revalidate: 60, tags: ["sections"] },
    }),
  ]);

  const activities: ActivityRecord[] = await activitiesRes.json();
  const sections: SectionRecord[] = await sectionsRes.json();

  let activeCityName: string | null = null;
  let scopedActivities = activities;

  if (citySlug) {
    activeCityName = slugToCityName(citySlug) ?? slugToRussian(citySlug);
    const cityLower = activeCityName.toLowerCase().replace(/^г\.\s*/, "");
    const cityFullLower = activeCityName.toLowerCase();
    scopedActivities = activities.filter((a) => {
      const loc = (a.location || "").toLowerCase();
      return loc.includes(cityFullLower) || loc.includes(cityLower);
    });
  }

  const sectionNameMap = new Map<string, string>();
  for (const s of sections) {
    sectionNameMap.set(s.category, s.name);
  }

  const activityCountBySection = new Map<string, number>();
  for (const a of scopedActivities) {
    activityCountBySection.set(
      a.section,
      (activityCountBySection.get(a.section) || 0) + 1
    );
  }

  const sectionPhotosMap = new Map<string, string[]>();
  for (const a of scopedActivities) {
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

  const visibleSections = citySlug
    ? sections.filter((s) => (activityCountBySection.get(s.category) || 0) > 0)
    : sections;

  const latest = [...scopedActivities]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map((a) => ({
      ...a,
      sectionName: sectionNameMap.get(a.section) || a.section,
    }));

  const promoActivities = activities.filter((a) => a.isPromo);
  const popularActivities = scopedActivities.filter(
    (a) => !a.isPromo && a.isPopular
  );
  const popular = [...promoActivities, ...popularActivities].map((a) => ({
    ...a,
    sectionName: sectionNameMap.get(a.section) || a.section,
  }));

  return (
    <div className="min-h-[calc(100vh-9rem)]">
      <HeroSlider>
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm">
          <Compass className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
          Найдите приключение по душе
        </h1>
        <p className="mx-auto max-w-xl text-base text-white/80">
          Трекинг, сплавы, дегустации, квесты и многое другое — выбирайте и
          бронируйте онлайн
        </p>
        <div className="mx-auto max-w-xl">
          <HeroSearch />
        </div>
      </HeroSlider>

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:py-12">
        {citySlug && scopedActivities.length === 0 && activeCityName ? (
          <EmptyCityState cityName={activeCityName} />
        ) : (
          <>
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <MapIcon className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Разделы
                </h2>
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {visibleSections.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    activityCount={
                      activityCountBySection.get(section.category) || 0
                    }
                    randomImage={
                      sectionRandomPhoto.get(section.category) ?? null
                    }
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
              promoOutline
            />
          </>
        )}
      </div>
    </div>
  );
}
