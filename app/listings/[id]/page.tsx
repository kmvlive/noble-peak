import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, Home, MapPin, Users, BedDouble } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { appName } from "@/lib/app-name";
import { isDatabaseAvailable } from "@/lib/db";
import { getListingById } from "@/lib/models";
import { mockListings } from "@/lib/mock-data";
import {
  getHousingTypeLabel,
  getListingSubtypeLabel,
} from "@noble-peak/shared";
import type { ListingRecord } from "@noble-peak/shared";
import { ListingBookingForm } from "@/components/listing-booking-form";

export const revalidate = 60;

async function fetchListing(id: string): Promise<ListingRecord | null> {
  try {
    if (await isDatabaseAvailable()) {
      const listing = await getListingById(id);
      return listing && listing.status === "active" ? listing : null;
    }
  } catch {
    // fall through to mock
  }
  return mockListings.find((l) => l.id === id && l.status === "active") ?? null;
}

function firstRealImage(images: string[]): string | undefined {
  return images?.find(
    (src) => src.startsWith("http") || src.startsWith("/uploads/")
  );
}

async function getAddressCoords(
  address: string
): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
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
  const dLat = 0.008;
  const dLon = 0.012;
  const bbox = `${lon - dLon},${lat - dLat},${lon + dLon},${lat + dLat}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchListing(id);

  if (!listing) {
    return { title: appName };
  }

  const title = `${listing.title} | ${appName}`;
  const image = firstRealImage(listing.images);

  return {
    title,
    description: listing.description || undefined,
    openGraph: {
      title,
      description: listing.description || undefined,
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description: listing.description || undefined,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await fetchListing(id);

  if (!listing) notFound();

  const realImages = (listing.images ?? []).filter(
    (src) => src.startsWith("http") || src.startsWith("/uploads/")
  );
  const heroImage = realImages[0];
  const geoQuery =
    listing.latitude !== undefined && listing.longitude !== undefined
      ? { lat: listing.latitude, lon: listing.longitude }
      : listing.address
        ? await getAddressCoords(`${listing.address}, ${listing.city}`)
        : null;
  const mapSrc = geoQuery ? osmEmbedUrl(geoQuery.lat, geoQuery.lon) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <Link
        href="/rent"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Все объявления
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="overflow-hidden rounded-xl border">
            {heroImage ? (
              <img
                src={heroImage}
                alt={listing.title}
                className="aspect-video w-full object-cover"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600">
                <Home className="h-16 w-16 text-white/80" />
              </div>
            )}
          </div>

          {realImages.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {realImages.map((src, i) => (
                <div key={i} className="overflow-hidden rounded-lg border">
                  <img
                    src={src}
                    alt={`${listing.title} — фото ${i + 1}`}
                    className="aspect-video w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Описание</h2>
              <p className="mt-1 whitespace-pre-line text-muted-foreground">
                {listing.description || "Описание пока не заполнено."}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">Расположение</h2>
              <div className="mt-2 overflow-hidden rounded-xl border">
                {mapSrc ? (
                  <iframe
                    src={mapSrc}
                    width="100%"
                    height="280"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Карта: ${listing.title}`}
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center bg-muted text-sm text-muted-foreground">
                    Карта недоступна
                  </div>
                )}
              </div>
              {listing.address && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {listing.address}, {listing.city}
                </p>
              )}
            </div>
          </div>
        </div>

        <aside>
          <Card>
            <CardContent className="p-5">
              <h1 className="text-2xl font-bold tracking-tight">
                {listing.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  <BedDouble className="mr-0.5 h-3 w-3" />
                  {getHousingTypeLabel(listing.housingType)}
                </Badge>
                <Badge variant="outline">
                  {getListingSubtypeLabel(listing.housingType, listing.subtype)}
                </Badge>
              </div>

              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {listing.city}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  до {listing.guests} гостей
                </p>
              </div>

              <p className="mt-5 text-3xl font-bold text-primary">
                {listing.price.toLocaleString("ru-RU")} ₽
              </p>
              <p className="text-sm text-muted-foreground">за сутки</p>

              <div className="mt-6">
                <ListingBookingForm
                  listingId={listing.id}
                  listingTitle={listing.title}
                  pricePerNight={listing.price}
                />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
