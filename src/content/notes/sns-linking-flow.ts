import { CheckCircle2, AlertTriangle, Lightbulb, Fingerprint, ArrowLeftRight, Ghost, UserX, EyeOff } from "lucide-react";
import type { NoteBody, NoteContent } from "@/lib/note-content";

const koLogin = `sequenceDiagram
    autonumber
    participant Browser as 브라우저
    participant Auth as 인증 서버
    participant IdP as 외부 ID 공급자 (Firebase)
    participant DB as 사용자 데이터베이스

    Browser->>IdP: SNS 계정으로 로그인 (팝업/리다이렉트)
    IdP-->>Browser: 신원 확인 토큰 (어떤 SNS로 들어왔는지 정보 포함)
    Browser->>Auth: 신원 확인 토큰 전달
    Auth->>IdP: 토큰 검증
    IdP-->>Auth: 검증 결과 (SNS 종류, 외부계정 식별자, 이메일 등)
    Auth->>DB: SNS 연결 테이블에서 해당 외부계정으로 내부 사용자 조회
    alt 연결된 내부 사용자 없음
        Auth-->>Browser: 로그인 실패 (가입 필요)
    else 연결됨
        Auth->>DB: 내부 사용자 정보 조회 (권한/상태 확인)
        opt 차단 도메인
            Auth->>DB: 상태 초기화 + 외부계정 연결 삭제 + 실제 외부 계정 삭제
        end
        Auth->>DB: 마이그레이션/휴면 확인 + 최근 로그인 시각 갱신
        Auth->>Auth: 로그인 성공 → 세션 쿠키 발급 (best-effort로 동기화도 트리거)
        Auth-->>Browser: 로그인 성공
    end`;

const koSync = `sequenceDiagram
    autonumber
    participant Browser as 브라우저
    participant Auth as 인증 서버
    participant IdP as 외부 ID 공급자 (Firebase)
    participant DB as 사용자 데이터베이스

    Browser->>Auth: 동기화 요청 (세션 쿠키 + 신원 확인 토큰)
    Auth->>Auth: 세션 쿠키에서 사용자 식별
    Auth->>IdP: 토큰 검증
    Auth->>DB: 사용자의 기본 외부계정(이메일 로그인용) 식별자 조회
    Auth->>Auth: 토큰의 외부계정 식별자가 기본 계정과 같은지 확인 (위장 방지)
    Auth->>IdP: 이 사용자에게 연결된 전체 Provider 목록 조회 (원본)
    IdP-->>Auth: [Google, Apple, Facebook 등 연결된 목록]
    Auth->>DB: 내부 SNS 연결 테이블 조회 (사본)
    Auth->>Auth: 원본 vs 사본 비교
    loop 원본에만 있음
        Auth->>DB: 신규 연결 추가
    end
    loop 둘 다 있지만 정보가 다름
        Auth->>DB: 정보 갱신
    end
    loop 사본에만 있음 (외부에서 연결 해제됨)
        Auth->>DB: 사본에서 삭제
    end
    Auth-->>Browser: 동기화 결과 (추가/삭제/갱신된 SNS 목록)`;

const enLogin = `sequenceDiagram
    autonumber
    participant Browser as 브라우저
    participant Auth as Auth server
    participant IdP as External identity provider (Firebase)
    participant DB as User database

    Browser->>IdP: log in with an SNS account (popup/redirect)
    IdP-->>Browser: identity token (includes which SNS was used)
    Browser->>Auth: hand over identity token
    Auth->>IdP: verify token
    IdP-->>Auth: result (SNS type, external-account id, email, etc.)
    Auth->>DB: look up internal user by external account in the SNS link table
    alt no linked internal user
        Auth-->>Browser: login failed (sign-up needed)
    else linked
        Auth->>DB: fetch internal user (role/state check)
        opt blocked domain
            Auth->>DB: reset state + remove link + delete the external account
        end
        Auth->>DB: check migration/dormant + update last-login time
        Auth->>Auth: login success → issue session cookie (best-effort sync triggered too)
        Auth-->>Browser: login success
    end`;

const enSync = `sequenceDiagram
    autonumber
    participant Browser as 브라우저
    participant Auth as Auth server
    participant IdP as External identity provider (Firebase)
    participant DB as User database

    Browser->>Auth: sync request (session cookie + identity token)
    Auth->>Auth: identify user from session cookie
    Auth->>IdP: verify token
    Auth->>DB: fetch the user's primary external account (for email login) id
    Auth->>Auth: check the token's external id matches the primary account (anti-impersonation)
    Auth->>IdP: fetch the full provider list linked to this user (source of truth)
    IdP-->>Auth: [Google, Apple, Facebook, ... linked list]
    Auth->>DB: read the internal SNS link table (the copy)
    Auth->>Auth: compare source vs copy
    loop in source only
        Auth->>DB: add new link
    end
    loop in both but info differs
        Auth->>DB: update info
    end
    loop in copy only (unlinked externally)
        Auth->>DB: delete from copy
    end
    Auth-->>Browser: sync result (added/removed/updated SNS list)`;

const ko: NoteBody = {
  intro: "Google·Apple·Facebook 같은 SNS 계정으로 로그인하는 흐름과, 외부 ID 공급자에 연결된 SNS 목록을 내부 DB와 동기화하는 흐름을 정리했습니다.",
  sections: [
    {
      label: "PURPOSE — 목적",
      title: "핵심 원칙",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "어떤 SNS가 사용자에게 연결되어 있는지는 외부 ID 공급자 쪽 정보가 항상 정답입니다. 내부 DB의 SNS 연결 테이블은 그 정보의 복사본일 뿐이라, 동기화는 외부 ID 공급자에서 DB로만 흐르는 단방향 구조로 설계했습니다.",
          ],
        },
      ],
    },
    {
      label: "HOW — 구현 방법",
      title: "로그인부터 동기화까지",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "SNS 로그인 시도", body: "브라우저가 외부 ID 공급자로 SNS 로그인을 하고 신원 확인 토큰을 받아 인증 서버에 전달한다." },
            { title: "토큰 검증 · 내부 사용자 조회", body: "인증 서버가 토큰을 검증하고, SNS 연결 테이블에서 해당 외부계정으로 내부 사용자를 조회한다. 연결된 사용자가 없으면 가입이 필요하다고 응답한다." },
            { title: "계정 상태 확인", body: "차단 도메인이면 상태를 초기화하고 외부계정 연결을 삭제한다. 그 외에는 마이그레이션 상태와 휴면 계정 여부를 확인한다." },
            { title: "로그인 성공 · 동기화 트리거", body: "로그인 세션 쿠키를 발급하면서 best-effort로 동기화도 함께 트리거한다." },
            { title: "동기화: 원본 조회", body: "인증 서버가 외부 ID 공급자에서 이 사용자에게 연결된 전체 Provider 목록(원본)을 조회한다." },
            { title: "동기화: 원본 vs 사본 비교", body: "내부 SNS 연결 테이블(사본)과 비교해, 원본에만 있으면 추가하고 정보가 다르면 갱신하며 사본에만 있으면(외부에서 연결 해제됨) 삭제한다." },
          ],
        },
      ],
    },
    {
      label: "KEY POINTS — 중요한 것",
      title: "핵심 포인트",
      blocks: [
        {
          kind: "keypoints",
          items: [
            { icon: Fingerprint, title: "외부 ID 공급자가 원본이고 내부 DB는 복사본이다", body: "어떤 SNS가 연결되어 있는지는 항상 외부 ID 공급자 쪽이 정답이다. 동기화는 외부 ID 공급자 → DB 단방향으로만 흐르고, DB 값으로 외부 ID 공급자를 바꾸는 경우는 없다." },
            { icon: Ghost, title: "Apple Private Relay 탈퇴 계정은 검증은 되는데 정보가 null이다", body: "verified: true로 응답하지만 사용자 정보가 null로 내려오는 케이스가 있다. 프론트는 이 경우를 신규 가입 유도로 처리해야 한다." },
            { icon: EyeOff, title: "지원하지 않는 provider는 에러 없이 조용히 무시된다", body: "동기화 시 SNS 타입이 지원 목록(Google/Apple/Facebook)에 없으면 필터링만 되고 에러를 던지지 않는다." },
            { icon: UserX, title: "이미 다른 사용자에 연결된 외부계정은 명시적으로 거부한다", body: "한 외부계정(Firebase UID)이 이미 다른 내부 사용자에 연결돼 있으면 마이그레이션·동기화 모두 거부 처리되어 계정 탈취·오연결을 막는다." },
            { icon: ArrowLeftRight, title: "동기화는 로그인 시 자동으로도, 연결·해제 직후에도 명시적으로 호출된다", body: "로그인 성공 후 best-effort로 한 번 시도되어 실패해도 로그인 자체는 성공 처리된다. 프론트에서 SNS를 연결·해제한 직후에는 명시적으로 다시 호출해 DB를 즉시 최신 상태로 맞춘다." },
          ],
        },
      ],
    },
    { label: "DIAGRAM — 로그인", title: "1. SNS 로그인", blocks: [{ kind: "mermaid", chart: koLogin }] },
    { label: "DIAGRAM — 동기화", title: "2. SNS 계정 동기화", blocks: [{ kind: "mermaid", chart: koSync }] },
    {
      label: "PROS — 장점",
      title: "이 구조가 좋은 이유",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "원본-사본 구조로 외부 공급자와 내부 DB 상태가 항상 한 방향으로만 흘러, 동시 수정으로 인한 충돌 우려가 없다.",
            "로그인 시 자동 동기화와 연결·해제 직후의 명시적 호출을 병행해 최신 상태를 빠르게 반영한다.",
            "이미 연결된 외부계정의 재사용을 명시적으로 거부해 계정 탈취·오연결을 막는다.",
          ],
        },
      ],
    },
    {
      label: "CONS — 단점 · 트레이드오프",
      title: "감수한 트레이드오프",
      blocks: [
        {
          kind: "list",
          icon: AlertTriangle,
          tone: "destructive",
          items: [
            "동기화가 best-effort라, 로그인 세션 발급과 실제 동기화 결과 사이에 짧은 시차가 생길 수 있다.",
            "지원하지 않는 provider가 조용히 무시되어, 사용자가 왜 특정 SNS가 연동 목록에 안 보이는지 파악하기 어려울 수 있다.",
            "Apple Private Relay 탈퇴 케이스처럼 verified:true인데 정보가 null인 응답은 프론트에서 별도 분기 처리가 필요해, 프론트-백엔드 계약이 암묵적이다.",
          ],
        },
      ],
    },
    {
      label: "NEXT — 개선점",
      title: "앞으로 개선하고 싶은 부분",
      blocks: [
        {
          kind: "list",
          icon: Lightbulb,
          tone: "muted",
          items: [
            "동기화 결과를 프론트에 실시간으로 알려, 로그인 직후의 시차를 줄인다.",
            "지원하지 않는 provider를 무시만 하지 않고 로그·메트릭으로 남겨 신규 provider 지원 필요성을 파악할 수 있게 한다.",
            "Apple Private Relay 같은 엣지 케이스를 명시적 상태 필드로 API 계약에 노출한다.",
          ],
        },
      ],
    },
  ],
};

const en: NoteBody = {
  intro: "The flow for logging in with SNS accounts like Google/Apple/Facebook, and for syncing the list of SNS links held by the external identity provider into the internal DB.",
  sections: [
    {
      label: "PURPOSE",
      title: "The core principle",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Which SNS accounts are linked to a user is always answered by the external identity provider. The internal DB's SNS link table is just a copy of that, so sync is designed as one-way — from the provider into the DB only.",
          ],
        },
      ],
    },
    {
      label: "HOW",
      title: "From login to sync",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "SNS login attempt", body: "The browser does an SNS login via the external provider, gets an identity token, and hands it to the auth server." },
            { title: "Verify token · look up internal user", body: "The auth server verifies the token and looks up the internal user by that external account in the SNS link table. If no linked user exists, it responds that sign-up is needed." },
            { title: "Check account state", body: "For a blocked domain, reset the state and remove the external-account link. Otherwise, check migration status and dormancy." },
            { title: "Login success · trigger sync", body: "While issuing the login session cookie, trigger the sync as best-effort too." },
            { title: "Sync: read the source", body: "The auth server fetches the full provider list linked to this user (the source of truth) from the external provider." },
            { title: "Sync: compare source vs copy", body: "Compared with the internal SNS link table (the copy): add what's only in the source, update where info differs, and delete what's only in the copy (unlinked externally)." },
          ],
        },
      ],
    },
    {
      label: "KEY POINTS",
      title: "Key points",
      blocks: [
        {
          kind: "keypoints",
          items: [
            { icon: Fingerprint, title: "The external provider is the source; the internal DB is a copy", body: "Which SNS are linked is always answered by the external provider. Sync flows one-way, provider → DB, and DB values never change the provider." },
            { icon: Ghost, title: "Apple Private Relay deleted accounts verify but return null info", body: "There are cases that respond verified: true but with null user info. The front end must treat this as prompting a new sign-up." },
            { icon: EyeOff, title: "Unsupported providers are silently ignored, no error", body: "During sync, an SNS type not in the supported list (Google/Apple/Facebook) is only filtered out — it doesn't throw." },
            { icon: UserX, title: "An external account already linked to another user is explicitly rejected", body: "If one external account (Firebase UID) is already linked to a different internal user, both migration and sync reject it, preventing account takeover and mis-linking." },
            { icon: ArrowLeftRight, title: "Sync runs automatically at login and explicitly right after link/unlink", body: "It's attempted once as best-effort after login; even if it fails, login itself still succeeds. Right after the user links/unlinks an SNS on the front end, it's called explicitly again to bring the DB up to date immediately." },
          ],
        },
      ],
    },
    { label: "DIAGRAM — LOGIN", title: "1. SNS login", blocks: [{ kind: "mermaid", chart: enLogin }] },
    { label: "DIAGRAM — SYNC", title: "2. SNS account sync", blocks: [{ kind: "mermaid", chart: enSync }] },
    {
      label: "PROS",
      title: "Why this design is good",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "The source-copy structure keeps provider and DB state flowing in one direction only, with no concurrent-edit conflicts.",
            "Automatic sync at login plus an explicit call right after link/unlink reflect the latest state quickly.",
            "Reuse of an already-linked external account is explicitly rejected, preventing takeover and mis-linking.",
          ],
        },
      ],
    },
    {
      label: "CONS",
      title: "Trade-offs accepted",
      blocks: [
        {
          kind: "list",
          icon: AlertTriangle,
          tone: "destructive",
          items: [
            "Because sync is best-effort, a brief gap can appear between session issuance and the actual sync result.",
            "Unsupported providers are silently ignored, so a user may struggle to understand why a given SNS doesn't appear in the linked list.",
            "Responses like the Apple Private Relay deletion case (verified:true but null info) need special front-end branching, making the front/back contract implicit.",
          ],
        },
      ],
    },
    {
      label: "NEXT",
      title: "What I'd improve next",
      blocks: [
        {
          kind: "list",
          icon: Lightbulb,
          tone: "muted",
          items: [
            "Report sync results to the front end in real time to shrink the post-login gap.",
            "Instead of just ignoring unsupported providers, log/metric them so the need to support a new provider is visible.",
            "Expose edge cases like Apple Private Relay as an explicit state field in the API contract.",
          ],
        },
      ],
    },
  ],
};

const content: NoteContent = { ko, en };
export default content;
