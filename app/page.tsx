import Link from "next/link";
import {
  Heart,
  MapPin,
  Star,
  Compass,
  Waves,
  Mountain,
  UtensilsCrossed,
  Bike,
  Gamepad2,
  Zap,
  Map,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  activities,
  latestActivities,
  popularActivities,
  sections,
} from "@/lib/data";
import type { Section } from "@/lib/data";

const sectionIcons: Record<string, React.ReactNode> = {
  Waves: <Waves className="h-6 w-6" />,
  Mountain: <Mountain className="h-6 w-6" />,
  UtensilsCrossed: <UtensilsCrossed className="h-6 w-6" />,
  Bike: <Bike className="h-6 w-6" />,
  Map: <Map className="h-6 w-6" />,
  Gamepad2: <Gamepad2 className="h-6 w-6" />,
  Zap: <Zap className="h-6 w-6" />,
};

function SectionCard({ section }: { section: Section }) {
  const activityCount = activities.filter(
    (a) => a.category.toLowerCase() === section.category.toLowerCase()
  ).length;

  return (
    <Link href={`/sections/${section.slug}`}>
      <Card className="min-w-[180px] snap-start card-hover">
        <div
          className={`flex h-24 items-center justify-center rounded-t-lg bg-gradient-to-br ${section.imageGradient}`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm">
            {sectionIcons[section.icon] || (
              <Compass className="h-6 w-6 text-white" />
            )}
          </div>
        </div>
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
}: {
  _id: string;
  title: string;
  shortDescription: string;
  category: string;
  price: number;
  imageGradient: string;
  likes: number;
}) {
  return (
    <Link href={`/activities/${_id}`}>
      <Card className="min-w-[260px] snap-start card-hover">
        <div
          className={`flex h-32 items-center justify-center bg-gradient-to-br ${imageGradient}`}
        >
          <Compass className="h-10 w-10 text-white/80" />
        </div>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              <MapPin className="mr-0.5 h-3 w-3" />
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
  items: typeof activities;
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
        {items.map(({ id, ...rest }) => (
          <ActivityCard key={id} _id={id} {...rest} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
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
              <Map className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">Разделы</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none">
            {sections.map((section) => (
              <SectionCard key={section.slug} section={section} />
            ))}
          </div>
        </section>

        <ActivitySection
          title="Последние активности"
          icon={Star}
          items={latestActivities}
        />

        <ActivitySection
          title="Популярные активности"
          icon={Heart}
          items={popularActivities}
        />
      </div>
    </div>
  );
}
