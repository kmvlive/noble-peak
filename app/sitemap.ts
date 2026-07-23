import type { MetadataRoute } from "next";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllActivities, getAllSections, getAllPartners } from "@/lib/models";
import { mockActivities, mockSections, mockPartners } from "@/lib/mock-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.BASE_URL ?? "https://magazin-tour.ru";

  const dbAvailable = await isDatabaseAvailable();

  let activities = mockActivities;
  let sections = mockSections;
  let partners = mockPartners;

  if (dbAvailable) {
    try {
      activities = await getAllActivities();
    } catch (error) {
      console.error("Sitemap: failed to fetch activities", error);
    }
    try {
      sections = await getAllSections();
    } catch (error) {
      console.error("Sitemap: failed to fetch sections", error);
    }
    try {
      partners = await getAllPartners();
    } catch (error) {
      console.error("Sitemap: failed to fetch partners", error);
    }
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  const sectionPages: MetadataRoute.Sitemap = sections.map((section) => ({
    url: `${baseUrl}/sections/${section.id}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const activityPages: MetadataRoute.Sitemap = activities.map((activity) => ({
    url: `${baseUrl}/activities/${activity.id}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const partnerPages: MetadataRoute.Sitemap = partners
    .filter((p) => p.slug)
    .map((partner) => ({
      url: `${baseUrl}/partners/${partner.slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  return [...staticPages, ...sectionPages, ...activityPages, ...partnerPages];
}
