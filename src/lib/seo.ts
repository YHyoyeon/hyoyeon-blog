import type { Metadata } from "next";
import { SITE_URL } from "@/lib/notes";
import { homePath, notePath, guestbookPath, dict, type Lang } from "@/lib/i18n";

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
    // Search Console 소유권 확인. vercel.app 서브도메인은 DNS TXT를 넣을 수 없어(존을 Vercel이 소유)
    // HTML 태그 방식으로 확인한다. 확인 방법마다 토큰이 다르니 TXT용 값을 넣으면 안 된다.
    // 파일 방식(public/googleb28e37b507de299f.html)도 함께 올려 둔 이중 확인이다.
    verification: { google: "6W2HLSzJNIbUKkJabpxwaSXJ5mEP4_DK29Jq8ZREwDc" },
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

export function guestbookMetadata(lang: Lang): Metadata {
  const title = dict[lang].guestbook;
  const description = dict[lang].guestbookIntro;
  return {
    title,
    description,
    alternates: {
      canonical: guestbookPath[lang],
      languages: languagesFor(guestbookPath.ko, guestbookPath.en),
    },
    openGraph: {
      type: "website",
      url: guestbookPath[lang],
      locale: ogLocale[lang],
      title,
      description,
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

export function noteJsonLd(
  lang: Lang,
  slug: string,
  title: string,
  description: string,
  date: string,
) {
  const url = `${SITE_URL}${notePath(lang, slug)}`;
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: title,
    description,
    inLanguage: lang,
    url,
    mainEntityOfPage: url,
    datePublished: date,
    dateModified: date,
    author: { "@type": "Person", name: AUTHOR },
    publisher: { "@type": "Person", name: AUTHOR },
    isPartOf: { "@type": "Blog", name: SITE_NAME, url: `${SITE_URL}${homePath[lang]}` },
  };
}
