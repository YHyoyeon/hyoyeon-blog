import type { NoteCategory } from "@/lib/notes";

export type Lang = "ko" | "en";

export const otherLang: Record<Lang, Lang> = { ko: "en", en: "ko" };

/** 언어별 홈 경로 접두사. ko는 루트, en은 /en */
export const homePath: Record<Lang, string> = { ko: "/", en: "/en" };
export const notePath = (lang: Lang, slug: string) =>
  lang === "ko" ? `/notes/${slug}` : `/en/notes/${slug}`;
export const guestbookPath: Record<Lang, string> = { ko: "/guestbook", en: "/en/guestbook" };

export const categoryLabelByLang: Record<Lang, Record<NoteCategory, string>> = {
  ko: { Incident: "장애", Auth: "인증", Infra: "인프라", Payments: "결제", Chain: "온체인" },
  en: { Incident: "Incident", Auth: "Auth", Infra: "Infra", Payments: "Payments", Chain: "On-chain" },
};

export const catLabel = (lang: Lang, cat: NoteCategory) => categoryLabelByLang[lang][cat];

type Dict = {
  brandSuffix: string;
  portfolio: string;
  allArticles: string;
  totalCount: (n: number) => string;
  searchPlaceholder: string;
  all: string;
  noResults: string;
  footerTagline: string;
  back: string;
  prev: string;
  next: string;
  relatedIn: (cat: string) => string;
  views: (n: number) => string;
  visitors: (n: number) => string;
  comments: string;
  guestbook: string;
  guestbookIntro: string;
};

export const dict: Record<Lang, Dict> = {
  ko: {
    brandSuffix: "Blog",
    portfolio: "포트폴리오",
    allArticles: "전체 아티클",
    totalCount: (n) => `총 ${n}편`,
    searchPlaceholder: "궁금한 글을 검색해 보세요",
    all: "전체",
    noResults: "검색 결과가 없어요. 다른 키워드로 검색해 보세요.",
    footerTagline: "기술 기록",
    back: "← 목록",
    prev: "이전 글",
    next: "다음 글",
    relatedIn: (cat) => `Related — ${cat} 카테고리의 다른 글`,
    views: (n) => `${n.toLocaleString("ko-KR")}회`,
    visitors: (n) => `방문자 ${n.toLocaleString("ko-KR")}명`,
    comments: "댓글",
    guestbook: "방명록",
    guestbookIntro: "지나가다 한마디 남겨 주세요. GitHub 계정으로 로그인하면 바로 쓸 수 있어요.",
  },
  en: {
    brandSuffix: "Blog",
    portfolio: "Portfolio",
    allArticles: "All Articles",
    totalCount: (n) => `${n} posts`,
    searchPlaceholder: "Search articles",
    all: "All",
    noResults: "No results. Try a different keyword.",
    footerTagline: "Engineering notes",
    back: "← All posts",
    prev: "Previous",
    next: "Next",
    relatedIn: (cat) => `Related — more in ${cat}`,
    views: (n) => `${n.toLocaleString("en-US")} views`,
    visitors: (n) => `${n.toLocaleString("en-US")} visitors`,
    comments: "Comments",
    guestbook: "Guestbook",
    guestbookIntro: "Leave a note if you're passing through. Sign in with GitHub and you're good to go.",
  },
};

export const langs: Lang[] = ["ko", "en"];
