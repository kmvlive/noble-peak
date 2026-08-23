import Link from "next/link";
import { Heart, MapIcon, Compass, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ActivityCard({
  _id,
  title,
  shortDescription,
  category,
  price,
  imageGradient,
  likes,
  images,
  isPromo,
}: {
  _id: string;
  title: string;
  shortDescription: string;
  category: string;
  price: number;
  imageGradient: string;
  likes: number;
  images: string[];
  isPromo?: boolean;
}) {
  const firstImage = images?.[0];
  const hasRealImage =
    firstImage &&
    (firstImage.startsWith("http") || firstImage.startsWith("/uploads/"));

  return (
    <Link href={`/activities/${_id}`}>
      <Card className="card-hover h-full">
        {hasRealImage ? (
          <div className="bg-muted">
            <img
              src={firstImage}
              alt={title}
              className="w-full rounded-t-lg max-h-48 object-contain"
            />
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
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <MapIcon className="mr-0.5 h-3 w-3" />
                {category}
              </Badge>
              {isPromo && (
                <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                  <Sparkles className="mr-0.5 h-3 w-3" />
                  Промо
                </Badge>
              )}
            </div>
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
