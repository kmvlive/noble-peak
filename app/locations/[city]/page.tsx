import Link from "next/link";
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Compass,
  Map,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActivityRecord } from "@/lib/models";
import {
  cityToSlug,
  slugToCityName,
  slugToRussian,
} from "@/lib/russian-cities";

export const revalidate = 60;

const ITEMS_PER_PAGE = 20;

async function getCityCoords(
  cityName: string
): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`,
      {
        headers: { "User-Agent": "magazin-tour/1.0" },
        next: { revalidate: 86400 },
      }
    );
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return {
        lat: Number.parseFloat(data[0].lat),
        lon: Number.parseFloat(data[0].lon),
      };
    }
  } catch {
    // geocoding unavailable — will render placeholder
  }
  return null;
}

function osmEmbedUrl(lat: number, lon: number): string {
  const dLat = 0.15;
  const dLon = 0.2;
  const bbox = `${lon - dLon},${lat - dLat},${lon + dLon},${lat + dLat}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

export default async function LocationPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { city } = await params;
  const { page: pageStr } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10) || 1);

  const cityDecoded = slugToCityName(city) ?? slugToRussian(city);
  const baseUrl = process.env.BASE_URL || "http://localhost:8080";

  const activitiesRes = await fetch(`${baseUrl}/api/activities`, {
    next: { revalidate: 60, tags: ["activities"] },
  });

  const activities: ActivityRecord[] = await activitiesRes.json();

  const cityLower = cityDecoded.toLowerCase().replace(/^г\.\s*/, "");
  const cityFullLower = cityDecoded.toLowerCase();

  const cityActivities = activities.filter((a) => {
    const loc = (a.location || "").toLowerCase();
    return loc.includes(cityFullLower) || loc.includes(cityLower);
  });

  const totalItems = cityActivities.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const clampedPage = Math.min(currentPage, totalPages);
  const offset = (clampedPage - 1) * ITEMS_PER_PAGE;
  const pageActivities = cityActivities.slice(offset, offset + ITEMS_PER_PAGE);

  const displayName = cityDecoded.replace(/^г\.\s*/, "");

  const coords = await getCityCoords(displayName);
  const mapSrc = coords ? osmEmbedUrl(coords.lat, coords.lon) : null;

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
        <div className="relative flex h-48 sm:h-56 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 mb-4">
          <Map className="absolute h-32 w-32 text-white/10 sm:h-40 sm:w-40" />
          <div className="relative z-10 flex flex-col items-center gap-2 text-white">
            <MapPin className="h-8 w-8" />
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-center">
              {displayName}
            </h1>
            {totalItems > 0 && (
              <p className="text-sm text-white/80">
                {totalItems}{" "}
                {totalItems === 1
                  ? "активность"
                  : totalItems >= 2 && totalItems <= 4
                    ? "активности"
                    : "активностей"}
              </p>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border">
          {mapSrc ? (
            <iframe
              src={mapSrc}
              width="100%"
              height="320"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Карта ${displayName}`}
            />
          ) : (
            <div className="flex h-80 items-center justify-center bg-muted text-sm text-muted-foreground">
              Карта недоступна
            </div>
          )}
        </div>
      </div>

      {pageActivities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Compass className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">
            В этом городе пока нет активностей, но вы можете стать первым
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Зарегистрируйтесь как партнёр и разместите первую активность
          </p>
          <Link href="/partner/login" className={cn(buttonVariants(), "mt-6")}>
            Стать партнёром
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageActivities.map((activity) => {
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
                          {activity.section}
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

          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2">
              {clampedPage > 1 ? (
                <Link
                  href={`/locations/${city}?page=${clampedPage - 1}`}
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors min-h-[44px]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Назад
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground opacity-50 min-h-[44px]">
                  <ChevronLeft className="h-4 w-4" />
                  Назад
                </span>
              )}

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Link
                      key={page}
                      href={`/locations/${city}?page=${page}`}
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                        page === clampedPage
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      {page}
                    </Link>
                  )
                )}
              </div>

              {clampedPage < totalPages ? (
                <Link
                  href={`/locations/${city}?page=${clampedPage + 1}`}
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors min-h-[44px]"
                >
                  Далее
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground opacity-50 min-h-[44px]">
                  Далее
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
