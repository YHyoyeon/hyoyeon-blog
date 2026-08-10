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

/**
 * `YYYY-MM-DD`를 언어별 표기로. timeZone을 UTC로 고정해야 날짜가 하루 밀리지 않고,
 * 서버·클라이언트가 같은 문자열을 만들어 하이드레이션도 어긋나지 않는다.
 */
export const formatDate = (date: string, lang: Lang) =>
  new Intl.DateTimeFormat(lang === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: lang === "ko" ? "long" : "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));

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
  toggleTheme: string;
  contactTitle: string;
  contactBody: string;
  guestbookCta: string;
  emailCta: string;
  formName: string;
  formEmail: string;
  formMessage: string;
  formSubmit: string;
  formSending: string;
  formSent: string;
  formInvalid: string;
  formRateLimited: string;
  formError: string;
};

/** 메인 페이지 연락 버튼이 여는 주소. */
export const CONTACT_EMAIL = "gydus.dev@gmail.com";

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
    toggleTheme: "테마 전환",
    contactTitle: "남기고 싶은 말이 있나요?",
    contactBody: "글에 대한 의견이든 그냥 인사든 좋아요. 일 이야기는 메일이 편합니다.",
    guestbookCta: "방명록 남기기",
    emailCta: "메일 보내기",
    formName: "이름",
    formEmail: "답장받을 이메일",
    formMessage: "내용",
    formSubmit: "보내기",
    formSending: "보내는 중…",
    formSent: "보냈어요. 읽고 답장드릴게요.",
    formInvalid: "이름·이메일·내용(10자 이상)을 확인해 주세요.",
    formRateLimited: "잠시 뒤에 다시 시도해 주세요.",
    formError: "전송에 실패했어요. 잠시 뒤 다시 시도해 주세요.",
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
    toggleTheme: "Toggle theme",
    contactTitle: "Anything you'd like to say?",
    contactBody: "Thoughts on a post, or just hello. For work, email is easier.",
    guestbookCta: "Sign the guestbook",
    emailCta: "Send an email",
    formName: "Name",
    formEmail: "Email for the reply",
    formMessage: "Message",
    formSubmit: "Send",
    formSending: "Sending…",
    formSent: "Sent. I'll read it and get back to you.",
    formInvalid: "Check the name, email, and message (10 characters or more).",
    formRateLimited: "Please try again in a bit.",
    formError: "Couldn't send that. Please try again in a bit.",
  },
};

export const langs: Lang[] = ["ko", "en"];
