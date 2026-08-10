import type { MetadataRoute } from "next";
import { notes, SITE_URL } from "@/lib/notes";
import { homePath, notePath, guestbookPath } from "@/lib/i18n";

type Entry = MetadataRoute.Sitemap[number];

const abs = (p: string) => `${SITE_URL}${p}`;

/** 같은 문서의 ko/en 두 URL을 서로 hreflang alternate로 묶어 내보낸다. */
const bilingual = (koPath: string, enPath: string, rest: Omit<Entry, "url" | "alternates">) => {
  const languages = { ko: abs(koPath), en: abs(enPath) };
  return [koPath, enPath].map((path) => ({ url: abs(path), ...rest, alternates: { languages } }));
};

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...bilingual(homePath.ko, homePath.en, { changeFrequency: "weekly", priority: 1 }),
    ...bilingual(guestbookPath.ko, guestbookPath.en, { changeFrequency: "weekly", priority: 0.5 }),
    ...notes.flatMap((n) =>
      bilingual(notePath("ko", n.slug), notePath("en", n.slug), {
        lastModified: n.date,
        changeFrequency: "monthly",
        priority: 0.7,
      }),
    ),
  ];
}
