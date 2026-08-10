import type { Lang } from "@/lib/i18n";

export const SITE_URL = "https://hyoyeon-blog.vercel.app";

export type NoteCategory = "Incident" | "Auth" | "Infra" | "Payments" | "Chain";

export type LangText = Record<Lang, string>;

export interface NoteMeta {
  slug: string;
  title: LangText;
  description: LangText;
  category: NoteCategory;
  /** 발행일 YYYY-MM-DD. 목록·이전/다음 내비의 정렬 기준이다. */
  date: string;
}

export const noteTitle = (n: NoteMeta, lang: Lang) => n.title[lang];
export const noteDesc = (n: NoteMeta, lang: Lang) => n.description[lang];

const entries: NoteMeta[] = [
  {
    slug: "sse-backfill-infinite-loop",
    title: {
      ko: "SSE 백필 무한 루프 — CPU 99% 장애 회고",
      en: "SSE Backfill Infinite Loop — a 99% CPU incident retro",
    },
    description: {
      ko: "빠진 한 글자 '('가 만든 무한 루프가 9개월 잠복 끝에 이벤트 루프를 포화시킨 과정과 추적기",
      en: "How a single missing '(' created an infinite loop that, dormant for 9 months, finally saturated the event loop — and how we traced it.",
    },
    category: "Incident",
    date: "2026-08-08",
  },
  {
    slug: "sso-kms-sequence",
    title: { ko: "KMS 기반 SSO 인증 구현", en: "KMS-backed SSO authentication" },
    description: {
      ko: "로그인부터 토큰 발급·리소스 접근·리프레시까지 실제로 구현한 SSO 흐름 정리",
      en: "The SSO flow as actually built — login, token issuance, resource access, and refresh.",
    },
    category: "Auth",
    date: "2026-08-08",
  },
  {
    slug: "legacy-cookie-compatibility",
    title: { ko: "로그인 쿠키 3종 동시 발급 구조", en: "Issuing three login cookies at once" },
    description: {
      ko: "레거시 서비스와의 호환을 위해 신규·레거시 쿠키를 동시에 굽는 이유와 구조",
      en: "Why we bake new and legacy cookies together for backward compatibility, and how it's structured.",
    },
    category: "Auth",
    date: "2026-08-08",
  },
  {
    slug: "migration-flow",
    title: {
      ko: "레거시 계정 → 신규 인증 체계 마이그레이션",
      en: "Migrating legacy accounts to a new auth system",
    },
    description: {
      ko: "구 유저를 외부 ID 공급자 기반 인증 체계로 옮기는 흐름과 상태 판단 로직",
      en: "The flow for moving old users onto an external identity provider, and the logic that decides each account's state.",
    },
    category: "Auth",
    date: "2026-08-08",
  },
  {
    slug: "sns-linking-flow",
    title: { ko: "SNS 계정 연동 · 동기화", en: "Social account linking & sync" },
    description: {
      ko: "외부 ID 공급자를 원본으로 삼아 내부 DB와 단방향으로 동기화하는 SNS 로그인 구조",
      en: "A social-login setup that treats the external identity provider as the source of truth and syncs one-way into our own DB.",
    },
    category: "Auth",
    date: "2026-08-08",
  },
  {
    slug: "payment-flows",
    title: { ko: "결제 플로우 (5개 PG 연동 방식 비교)", en: "Payment flows — comparing 5 PG integrations" },
    description: {
      ko: "호스팅 리다이렉트형·토큰 발급형·코드 검증형·레거시 SOAP형이 섞인 5개 PG 연동 구조 비교",
      en: "Comparing five payment-gateway integrations — hosted redirect, token issuance, code verification, and legacy SOAP.",
    },
    category: "Payments",
    date: "2026-08-08",
  },
  {
    slug: "monorepo-structure",
    title: { ko: "모노레포 구조", en: "Monorepo structure" },
    description: {
      ko: "pnpm workspace 기반 apps·packages 레이어 구분과 의존성 관리 방식",
      en: "How apps and packages are layered on a pnpm workspace, and how dependencies are managed.",
    },
    category: "Infra",
    date: "2026-08-08",
  },
  {
    slug: "bun-hono-usage",
    title: { ko: "Bun + Hono 사용기", en: "Using Bun + Hono" },
    description: {
      ko: "Bun 런타임과 Hono API 프레임워크를 실제 프로젝트에 써보며 체감한 장단점 정리",
      en: "Patterns, pros, and cons from actually shipping a project on the Bun runtime with the Hono API framework.",
    },
    category: "Infra",
    date: "2026-08-08",
  },
  {
    slug: "graphify-knowledge-graph",
    title: {
      ko: "graphify 적용기 — 코드베이스를 지식그래프로 질의하기",
      en: "Applying graphify — querying a codebase as a knowledge graph",
    },
    description: {
      ko: "2,000여 파일을 15,008노드 그래프로 만들어 0 토큰에 얻고, 아키텍처 질의 1건을 약 51,800 → 4,000 토큰으로 줄인 실측 기록",
      en: "Turning ~2,000 files into a 15,008-node graph for zero tokens, and cutting one architecture query from ~51,800 to ~4,000 tokens — measured.",
    },
    category: "Infra",
    date: "2026-08-10",
  },
  {
    slug: "kingdomscan-indexer",
    title: {
      ko: "kingdomScan: 자체 구축 블록체인 인덱서",
      en: "kingdomScan: a home-built blockchain indexer",
    },
    description: {
      ko: "인덱서·서명 허브·운영자 워커 세 역할을 겸하는 서비스의 구조",
      en: "The architecture of a service that is at once an indexer, a signing hub, and an operator worker.",
    },
    category: "Chain",
    date: "2026-08-08",
  },
  {
    slug: "random-box-vrf",
    title: {
      ko: "랜덤박스(가챠) 확률 시스템과 'VRF'의 실체",
      en: "Gacha loot boxes and what 'VRF' really is",
    },
    description: {
      ko: "이름은 VRF지만 실제로는 오프체인 워커가 난수를 만드는 온체인 가챠 구조",
      en: "An on-chain gacha system named 'VRF' where the randomness is actually produced by an off-chain worker.",
    },
    category: "Chain",
    date: "2026-08-08",
  },
  {
    slug: "nft-mint-and-purchase-sync",
    title: {
      ko: "NFT 발행 → 구매: 온체인/오프체인 동기화",
      en: "NFT mint → purchase: on-chain/off-chain sync",
    },
    description: {
      ko: "서버가 개인키 없이 서명만 발급하고, 소유권은 항상 온체인 트랜잭션으로 확정되는 구조",
      en: "A design where the server only issues signatures (never holds a private key) and ownership is always settled by an on-chain transaction.",
    },
    category: "Chain",
    date: "2026-08-08",
  },
  {
    slug: "nft-marketplace-purchase-flow",
    title: { ko: "NFT 마켓플레이스 구매 동기화 구조", en: "NFT marketplace purchase sync" },
    description: {
      ko: "온체인에서 먼저 확정되는 구매 트랜잭션과, 2단 폴링으로 뒤늦게 DB에 반영되는 흐름",
      en: "A purchase that settles on-chain first and lands in the DB later through two-stage polling.",
    },
    category: "Chain",
    date: "2026-08-08",
  },
  {
    slug: "cross-chain-bridge",
    title: {
      ko: "크로스체인 브릿지 — 소각·발행 기반 자산 이동",
      en: "Cross-chain bridge — burn-and-mint asset transfer",
    },
    description: {
      ko: "같은 자산을 여러 체인에서 각각 발행해 운영하다 보니 필요해진 소각-발행 기반 브릿지 구조",
      en: "A burn-and-mint bridge that grew out of running the same asset issued separately on multiple chains.",
    },
    category: "Chain",
    date: "2026-08-08",
  },
  {
    slug: "quest-attendance-swap-flow",
    title: {
      ko: "출석체크·미션·스왑 — 온체인 트랜잭션 연동 구조",
      en: "Attendance, quests, swap — on-chain transaction integration",
    },
    description: {
      ko: "지금은 삭제됐지만, 서명 발급 → 온체인 제출 → 오프체인 정산 패턴을 재사용했던 기능들",
      en: "Now-removed features that reused one pattern: issue a signature, submit on-chain, settle off-chain.",
    },
    category: "Chain",
    date: "2026-08-08",
  },
];

/** 최신순(date 내림차순). 날짜가 같으면 위 배열에 쓴 순서가 그대로 유지된다(sort는 stable). */
export const notes: NoteMeta[] = entries.sort((a, b) => b.date.localeCompare(a.date));
