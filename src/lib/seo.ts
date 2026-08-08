import type { Metadata } from "next";
import { SITE_URL } from "@/lib/notes";
import { homePath, notePath, type Lang } from "@/lib/i18n";

export const SITE_NAME = "YHyoyeon Blog";
export const AUTHOR = "Hyoyeon Yoon";

const home: Record<Lang, { title: string; description: string }> = {
  ko: {
    title: "YHyoyeon Blog — 윤효연의 기술 블로그",
    description:
      "장애 회고, 인증 설계, 온체인·오프체인 동기화, 결제 연동 — 실무에서 직접 해결한 기술 문제들의 기록.",
  },
  en: {
    title: "YHyoyeon Blog — Hyoyeon Yoon's engineering notes",
    description:
      "Incident retros, auth design, on-chain/off-chain sync, and payment integrations — notes on real engineering problems solved in production.",
  },
};

const ogLocale: Record<Lang, string> = { ko: "ko_KR", en: "en_US" };

const languagesFor = (koPath: string, enPath: string) => ({
  ko: koPath,
  en: enPath,
  "x-default": koPath,
});

/** Root layout metadata per language tree. */
export function rootMetadata(lang: Lang): Metadata {
  const m = home[lang];
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: m.title, template: `%s — ${SITE_NAME}` },
    description: m.description,
    applicationName: SITE_NAME,
    authors: [{ name: AUTHOR }],
    creator: AUTHOR,
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: ogLocale[lang],
      title: m.title,
      description: m.description,
    },
    twitter: { card: "summary_large_image" },
  };
}

export function homeMetadata(lang: Lang): Metadata {
  const m = home[lang];
  return {
    title: { absolute: m.title },
    description: m.description,
    alternates: {
      canonical: homePath[lang],
      languages: languagesFor(homePath.ko, homePath.en),
    },
    openGraph: {
      type: "website",
      url: homePath[lang],
      locale: ogLocale[lang],
      title: m.title,
      description: m.description,
    },
  };
}

export function noteMetadata(
  lang: Lang,
  slug: string,
  title: string,
  description: string,
): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: notePath(lang, slug),
      languages: languagesFor(notePath("ko", slug), notePath("en", slug)),
    },
    openGraph: {
      type: "article",
      url: notePath(lang, slug),
      locale: ogLocale[lang],
      title,
      description,
    },
  };
}

export function homeJsonLd(lang: Lang) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: SITE_NAME,
    url: `${SITE_URL}${homePath[lang]}`,
    inLanguage: lang,
    description: home[lang].description,
    author: { "@type": "Person", name: AUTHOR },
  };
}

export function noteJsonLd(lang: Lang, slug: string, title: string, description: string) {
  const url = `${SITE_URL}${notePath(lang, slug)}`;
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: title,
    description,
    inLanguage: lang,
    url,
    mainEntityOfPage: url,
    author: { "@type": "Person", name: AUTHOR },
    publisher: { "@type": "Person", name: AUTHOR },
    isPartOf: { "@type": "Blog", name: SITE_NAME, url: `${SITE_URL}${homePath[lang]}` },
  };
}
