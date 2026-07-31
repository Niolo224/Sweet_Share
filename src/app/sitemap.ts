import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Built from the database, so adding a dessert in the dashboard puts it in the
 * sitemap without anybody remembering to.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/gallery`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/club`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/gift-cards`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/rewards`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/pantry`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/story`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/gatherings`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/testimonials`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/order`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const desserts = await prisma.dessert.findMany({
      select: { slug: true, updatedAt: true, isAvailable: true },
      orderBy: { sortOrder: "asc" },
    });

    return [
      ...staticPages.map((page) => ({ ...page, lastModified: new Date() })),
      ...desserts.map((dessert) => ({
        url: `${SITE_URL}/gallery/${dessert.slug}`,
        lastModified: dessert.updatedAt,
        changeFrequency: "monthly" as const,
        priority: dessert.isAvailable ? 0.9 : 0.4,
      })),
    ];
  } catch {
    // A sitemap that loses the product pages still beats a 500.
    return staticPages.map((page) => ({ ...page, lastModified: new Date() }));
  }
}
