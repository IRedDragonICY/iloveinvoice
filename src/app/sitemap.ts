import type { MetadataRoute } from "next";
import { headers } from "next/headers";

async function getSiteUrl(): Promise<string> {
  try {
    // Get the current request headers to detect the domain
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = headersList.get("x-forwarded-proto") || "https";
    
    if (host) {
      // If we have a host, construct the URL dynamically
      // Use HTTPS for production domains, HTTP for localhost
      const useHttps = host.includes("vercel.app") || 
                      host.includes("netlify.app") || 
                      !host.includes("localhost");
      
      const finalProtocol = useHttps ? "https" : protocol === "https" ? "https" : "http";
      return `${finalProtocol}://${host}`;
    }
  } catch (error) {
    // Headers might not be available during build time
    console.log("Headers not available, falling back to environment variables");
  }
  
  // Fallback to environment variables if headers are not available
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  
  // Final fallback for development
  return "http://localhost:3000";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getSiteUrl();
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


