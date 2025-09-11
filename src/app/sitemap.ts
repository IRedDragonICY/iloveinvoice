import type { MetadataRoute } from "next";

const siteUrlRaw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const siteUrl = siteUrlRaw.replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const extra = (process.env.NEXT_PUBLIC_SITEMAP_PATHS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((path) => (path.startsWith("/") ? path : `/${path}`));

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...extra.map<MetadataRoute.Sitemap[number]>((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    })),
  ];

  return entries;
}


