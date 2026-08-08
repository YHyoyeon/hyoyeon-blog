import type { MetadataRoute } from "next";
import { notes, SITE_URL } from "@/lib/notes";
import { homePath, notePath } from "@/lib/i18n";

const abs = (p: string) => `${SITE_URL}${p}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const homeLangs = { ko: abs(homePath.ko), en: abs(homePath.en) };

  const homeEntries: MetadataRoute.Sitemap = [
    { url: abs(homePath.ko), changeFrequency: "weekly", priority: 1, alternates: { languages: homeLangs } },
    { url: abs(homePath.en), changeFrequency: "weekly", priority: 0.9, alternates: { languages: homeLangs } },
  ];

  const noteEntries: MetadataRoute.Sitemap = notes.flatMap((n) => {
    const languages = { ko: abs(notePath("ko", n.slug)), en: abs(notePath("en", n.slug)) };
    return (["ko", "en"] as const).map((lang) => ({
      url: abs(notePath(lang, n.slug)),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: { languages },
    }));
  });

  return [...homeEntries, ...noteEntries];
}
