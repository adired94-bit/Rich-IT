import type { MetadataRoute } from "next";

/** Private CRM — no public pages to index. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
