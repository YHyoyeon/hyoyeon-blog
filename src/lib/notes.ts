export const SITE_URL = "https://hyoyeon-blog.vercel.app";

export type NoteCategory = "Incident" | "Auth" | "Infra" | "Payments" | "Chain";

export interface NoteMeta {
  slug: string;
  title: string;
  description: string;
  category: NoteCategory;
  /** 페이지가 이식 완료된 노트만 목록에서 링크로 노출 */
  published?: boolean;
}

export const categoryLabel: Record<NoteCategory, string> = {
  Incident: "장애",
  Auth: "인증",
  Infra: "인프라",
  Payments: "결제",
  Chain: "온체인",
};

export const notes: NoteMeta[] = [
  {
    slug: "sse-backfill-infinite-loop",
    title: "SSE 백필 무한 루프 — CPU 99% 장애 회고",
    description:
      "빠진 한 글자 '('가 만든 무한 루프가 9개월 잠복 끝에 이벤트 루프를 포화시킨 과정과 추적기",
    category: "Incident",
  },
  {
    slug: "sso-kms-sequence",
    title: "KMS 기반 SSO 인증 구현",
    description: "로그인부터 토큰 발급·리소스 접근·리프레시까지 실제로 구현한 SSO 흐름 정리",
    category: "Auth",
  },
  {
    slug: "legacy-cookie-compatibility",
    title: "로그인 쿠키 3종 동시 발급 구조",
    description: "레거시 서비스와의 호환을 위해 신규·레거시 쿠키를 동시에 굽는 이유와 구조",
    category: "Auth",
  },
  {
    slug: "migration-flow",
    title: "레거시 계정 → 신규 인증 체계 마이그레이션",
    description: "구 유저를 외부 ID 공급자 기반 인증 체계로 옮기는 흐름과 상태 판단 로직",
    category: "Auth",
  },
  {
    slug: "sns-linking-flow",
    title: "SNS 계정 연동 · 동기화",
    description: "외부 ID 공급자를 원본으로 삼아 내부 DB와 단방향으로 동기화하는 SNS 로그인 구조",
    category: "Auth",
  },
  {
    slug: "payment-flows",
    title: "결제 플로우 (5개 PG 연동 방식 비교)",
    description:
      "호스팅 리다이렉트형·토큰 발급형·코드 검증형·레거시 SOAP형이 섞인 5개 PG 연동 구조 비교",
    category: "Payments",
  },
  {
    slug: "monorepo-structure",
    title: "모노레포 구조",
    description: "pnpm workspace 기반 apps·packages 레이어 구분과 의존성 관리 방식",
    category: "Infra",
  },
  {
    slug: "bun-hono-usage",
    title: "Bun + Hono 사용기",
    description: "Bun 런타임과 Hono API 프레임워크를 실제 프로젝트에 써보며 체감한 장단점 정리",
    category: "Infra",
  },
  {
    slug: "kingdomscan-indexer",
    title: "kingdomScan: 자체 구축 블록체인 인덱서",
    description: "인덱서·서명 허브·운영자 워커 세 역할을 겸하는 서비스의 구조",
    category: "Chain",
  },
  {
    slug: "random-box-vrf",
    title: "랜덤박스(가챠) 확률 시스템과 'VRF'의 실체",
    description: "이름은 VRF지만 실제로는 오프체인 워커가 난수를 만드는 온체인 가챠 구조",
    category: "Chain",
  },
  {
    slug: "nft-mint-and-purchase-sync",
    title: "NFT 발행 → 구매: 온체인/오프체인 동기화",
    description: "서버가 개인키 없이 서명만 발급하고, 소유권은 항상 온체인 트랜잭션으로 확정되는 구조",
    category: "Chain",
  },
  {
    slug: "nft-marketplace-purchase-flow",
    title: "NFT 마켓플레이스 구매 동기화 구조",
    description: "온체인에서 먼저 확정되는 구매 트랜잭션과, 2단 폴링으로 뒤늦게 DB에 반영되는 흐름",
    category: "Chain",
  },
  {
    slug: "cross-chain-bridge",
    title: "크로스체인 브릿지 — 소각·발행 기반 자산 이동",
    description: "같은 자산을 여러 체인에서 각각 발행해 운영하다 보니 필요해진 소각-발행 기반 브릿지 구조",
    category: "Chain",
  },
  {
    slug: "quest-attendance-swap-flow",
    title: "출석체크·미션·스왑 — 온체인 트랜잭션 연동 구조",
    description: "지금은 삭제됐지만, 서명 발급 → 온체인 제출 → 오프체인 정산 패턴을 재사용했던 기능들",
    category: "Chain",
  },
];
