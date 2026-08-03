import type { MetadataRoute } from "next";
import { notes, SITE_URL } from "@/lib/notes";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...notes.map((n) => ({
      url: `${SITE_URL}/notes/${n.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
