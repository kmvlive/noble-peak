import Link from "next/link";
import { Home, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getHousingTypeLabel,
  getListingSubtypeLabel,
} from "@noble-peak/shared";
import type { ListingRecord } from "@noble-peak/shared";

function firstRealImage(images: string[]): string | undefined {
  return images?.find(
    (src) => src.startsWith("http") || src.startsWith("/uploads/")
  );
}

export function ListingCard({ listing }: { listing: ListingRecord }) {
  const image = firstRealImage(listing.images);

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="h-full card-hover">
        {image ? (
          <div className="h-44 overflow-hidden rounded-t-lg bg-muted">
            <img
              src={image}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-44 items-center justify-center rounded-t-lg bg-gradient-to-br from-indigo-500 to-blue-600">
            <Home className="h-10 w-10 text-white/80" />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary">
              <MapPin className="mr-0.5 h-3 w-3" />
              {listing.city}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {getListingSubtypeLabel(listing.housingType, listing.subtype)}
            </span>
          </div>
          <CardTitle className="mt-1 line-clamp-1">{listing.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {getHousingTypeLabel(listing.housingType)}
          </p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-lg font-semibold text-primary">
              {listing.price.toLocaleString("ru-RU")} ₽
            </p>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              до {listing.guests} гостей
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
