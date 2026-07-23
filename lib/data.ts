export interface Activity {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  images: string[];
  category: string;
  price: number;
  partnerPrice?: number;
  imageGradient: string;
  likes: number;
  isPopular: boolean;
  over18: boolean;
  orderType: "order_form" | "payment";
  location?: string;
  partnerEmail?: string;
}

export interface Section {
  slug: string;
  name: string;
  description: string;
  icon: string;
  imageGradient: string;
  category: string;
}

export const sections: Section[] = [];

export function getActivitiesByCategory(category: string): Activity[] {
  return activities.filter(
    (a) => a.category.toLowerCase() === category.toLowerCase()
  );
}

export function getSectionBySlug(slug: string): Section | undefined {
  return sections.find((s) => s.slug === slug);
}

export const activities: Activity[] = [];

export const latestActivities = activities.slice(0, 5);

export const popularActivities = activities.filter((a) => a.isPopular);
