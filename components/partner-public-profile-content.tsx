"use client";

import { User, MapPin, Compass, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ShareButton } from "@/components/share-button";

interface PartnerActivity {
  id: string;
  title: string;
  shortDescription: string;
  price: number;
  location?: string;
  images: string[];
  imageGradient: string;
  section: string;
}

function getActivityImage(activity: PartnerActivity): string | null {
  const image = activity.images?.find(
    (src) =>
      typeof src === "string" &&
      src.length > 0 &&
      (src.startsWith("http://") ||
        src.startsWith("https://") ||
        src.startsWith("/uploads/"))
  );
  return image || null;
}

interface PartnerPublicData {
  email: string;
  name: string;
  photo: string;
  description: string;
  slug: string;
  activities: PartnerActivity[];
}

export function PartnerPublicProfileContent({
  partner,
}: {
  partner: PartnerPublicData;
}) {
  const profileUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `/partners/${encodeURIComponent(partner.slug || partner.email)}`;

  const hasPhoto = partner.photo && partner.photo.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start sm:gap-6">
        <div className="mb-4 sm:mb-0 shrink-0">
          {hasPhoto ? (
            <img
              src={partner.photo}
              alt={partner.name}
              className="h-28 w-28 rounded-full object-cover ring-4 ring-muted"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-muted">
              <User className="h-12 w-12" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {partner.name}
          </h1>
          {partner.description && (
            <div
              className="prose prose-sm sm:prose-base max-w-none mt-3 text-muted-foreground prose-headings:text-foreground"
              dangerouslySetInnerHTML={{ __html: partner.description }}
            />
          )}
          <div className="mt-4">
            <ShareButton url={profileUrl} title={partner.name} />
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          Активности партнёра
        </h2>
        {partner.activities.length === 0 ? (
          <p className="text-muted-foreground">
            У партнёра пока нет активных активностей
          </p>
        ) : (
          <ul className="divide-y">
            {partner.activities.map((activity) => (
              <li key={activity.id}>
                <Link
                  href={`/activities/${activity.id}`}
                  className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/50 rounded-lg px-3 -mx-3 group"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${activity.imageGradient} overflow-hidden`}
                  >
                    {getActivityImage(activity) ? (
                      <img
                        src={getActivityImage(activity)!}
                        alt={activity.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Compass className="h-5 w-5 text-white/70" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate group-hover:text-primary transition-colors">
                      {activity.title}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.shortDescription}
                    </p>
                    {activity.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {activity.location}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">
                      {activity.price.toLocaleString("ru-RU")} ₽
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
