import { CheckCircle2, AlertTriangle, Lightbulb, ListChecks, UserCog, ShieldAlert, ShieldCheck, Link2 } from "lucide-react";
import type { NoteBody, NoteContent } from "@/lib/note-content";

const koChart = `sequenceDiagram
    autonumber
    participant User as 사용자
    participant Browser as 브라우저
    participant Auth as 인증 서버
    participant IdP as 외부 ID 공급자 (Firebase)
    participant DB as 사용자 데이터베이스

    Note over Browser,DB: 1. SNS 로그인 버튼 클릭 전 사전 확인 (선택적으로 호출)
    Browser->>Auth: 이메일 또는 사용자ID로 마이그레이션 상태 조회
    Auth->>DB: 사용자 조회 (이메일/외부계정 연결 테이블 등 여러 경로로 탐색)
    alt 사용자 없음
        Auth-->>Browser: userExists=false → 회원가입 유도
    else 사용자 있음
        Auth->>DB: 마이그레이션 레코드 조회
        Auth-->>Browser: userExists=true, migrationNeeded, userType, isEmailVerified
    end

    Note over Browser,DB: 2. 실제 로그인 시도 시 서버가 자체적으로도 재검증
    User->>Browser: 아이디/비밀번호 로그인 시도
    Browser->>Auth: 로그인 요청
    Auth->>DB: 마이그레이션 레코드 확인
    alt 레코드 없음 또는 완료 상태 아님
        Auth-->>Browser: 마이그레이션 필요 응답
    else NA 또는 COMPLETED
        Note over Auth: 정상 로그인 진행 (별도 문서: SSO 시퀀스 참고)
    end

    Note over Browser,DB: 3. 마이그레이션 실행 (프론트에서 별도 유도 플로우로 진입)
    Browser->>IdP: 이메일 인증을 거쳐 외부 ID 공급자 신원 확보
    IdP-->>Browser: 신원 확인 토큰
    Browser->>Auth: 마이그레이션 처리 요청 (신원 확인 토큰 전달)
    Auth->>IdP: 토큰 검증
    IdP-->>Auth: 검증 결과 (이메일 포함)
    Auth->>DB: 이메일로 내부 사용자 조회 + 이메일 일치/인증 확인
    alt 이메일 미인증
        Auth-->>Browser: 이메일 인증 필요 에러
    else 이메일 인증됨
        Auth->>DB: 외부계정 연결 테이블에 저장 (1 사용자 = 1 외부계정 원칙, upsert)
        Auth->>DB: 마이그레이션 레코드 생성/갱신 → COMPLETED
        Auth-->>Browser: 마이그레이션 완료 (이후 정상 로그인 가능)
    end`;

const enChart = `sequenceDiagram
    autonumber
    participant User as User
    participant Browser as Browser
    participant Auth as Auth server
    participant IdP as External identity provider (Firebase)
    participant DB as User database

    Note over Browser,DB: 1. Pre-check before clicking the SNS login button (optional)
    Browser->>Auth: query migration status by email or user id
    Auth->>DB: look up user (via email / external-account link table, several paths)
    alt no user
        Auth-->>Browser: userExists=false → prompt sign-up
    else user exists
        Auth->>DB: fetch migration record
        Auth-->>Browser: userExists=true, migrationNeeded, userType, isEmailVerified
    end

    Note over Browser,DB: 2. On the actual login attempt the server re-verifies too
    User->>Browser: try id/password login
    Browser->>Auth: login request
    Auth->>DB: check migration record
    alt no record or not completed
        Auth-->>Browser: migration-needed response
    else NA or COMPLETED
        Note over Auth: proceed with normal login (see separate SSO sequence)
    end

    Note over Browser,DB: 3. Run migration (entered via a separate front-end flow)
    Browser->>IdP: obtain IdP identity through email verification
    IdP-->>Browser: identity token
    Browser->>Auth: migration request (with identity token)
    Auth->>IdP: verify token
    IdP-->>Auth: result (with email)
    Auth->>DB: look up internal user by email + check email match/verification
    alt email not verified
        Auth-->>Browser: email-verification-required error
    else email verified
        Auth->>DB: store in external-account link table (1 user = 1 external account, upsert)
        Auth->>DB: create/update migration record → COMPLETED
        Auth-->>Browser: migration complete (normal login from here on)
    end`;

const ko: NoteBody = {
  intro: "과거 자체 아이디/비밀번호로 가입한 구 유저를 외부 ID 공급자(Firebase) 기반 체계로 옮기는 흐름을 정리했습니다.",
  sections: [
    {
      label: "PURPOSE — 목적",
      title: "왜 필요한가",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "새 인증 서버는 로그인 판단을 외부 ID 공급자에게 위임하고 내부 DB는 매핑만 가집니다. 하지만 구 유저는 애초에 외부 계정이 없어, 로그인을 시도하는 시점에 최초 1회 연결 작업이 필요합니다. 신규 가입자는 처음부터 새 체계로 들어오기 때문에 이 과정이 필요 없습니다.",
          ],
        },
      ],
    },
    {
      label: "HOW — 구현 방법",
      title: "동작 흐름",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "사전 확인 (선택)", body: "SNS 로그인 버튼을 누르기 전, 이메일/아이디로 마이그레이션 상태를 미리 조회해 회원가입 유도 여부를 판단한다." },
            { title: "로그인 시도 시 재검증", body: "실제 로그인 요청이 오면 서버가 마이그레이션 레코드를 다시 확인한다. 레코드가 없거나 완료 상태가 아니면 마이그레이션이 필요하다고 응답한다." },
            { title: "이메일 인증", body: "프론트의 별도 유도 플로우로 진입해 외부 ID 공급자(Firebase)를 거쳐 이메일 인증 신원을 확보한다." },
            { title: "신원 토큰 검증", body: "인증 서버가 토큰의 진위를 검증하고, DB의 이메일과 토큰의 이메일이 일치하는지 확인한다." },
            { title: "계정 연결", body: "이메일 인증이 완료된 상태면 외부계정 연결 테이블에 저장한다. 이미 다른 사용자에 연결된 firebase 계정이면 실패 처리한다." },
            { title: "마이그레이션 완료", body: "마이그레이션 레코드가 없던 경우에만 새로 만들어 COMPLETED로 표시한다. 이미 레코드가 있으면(예: 이전에 FAILED였던 경우) 상태를 갱신하지 않고 그대로 둔다." },
          ],
        },
      ],
    },
    {
      label: "KEY POINTS — 중요한 것",
      title: "핵심 설계 포인트",
      blocks: [
        {
          kind: "keypoints",
          items: [
            { icon: ListChecks, title: "마이그레이션 상태는 3가지뿐이다", body: "NA(해당 없음)·COMPLETED(완료)·FAILED(실패)로만 관리한다. PENDING 같은 중간 상태는 없다." },
            { icon: UserCog, title: "사용자 타입(NEW/OLD)이 우선이고, 레코드 없음은 예외 케이스다", body: "레코드가 있으면 사용자 타입 필드로 먼저 판단한다. 레코드 자체가 없을 때만 구 유저로 암묵 처리한다." },
            { icon: ShieldAlert, title: "차단 도메인 초기화는 일부 진입점에서만 실행된다", body: "로그인 시도·상태 조회 경로에서는 자동으로 초기화되지만, 마이그레이션 처리 자체나 비밀번호 로그인 경로는 이 검사를 거치지 않는다." },
            { icon: ShieldCheck, title: "이메일 인증에는 엄격한 레이트리밋이 걸려 있다", body: "24시간 10회, 재전송 30초 간격, 인증코드 5분 유효, 5회 실패 시 30분 잠금 — 모두 Redis 기반으로 관리한다." },
            { icon: Link2, title: "1 사용자 = 1 firebase 계정이 원칙, SNS 연동은 여러 개 허용", body: "이메일·firebase 계정은 한 사용자에 하나만 연결되지만, Google·Facebook·Apple 같은 SNS 연동은 여러 개를 동시에 허용하고 firebase 쪽을 기준으로 동기화한다." },
          ],
        },
      ],
    },
    { label: "DIAGRAM — 시퀀스", title: "시퀀스 다이어그램", blocks: [{ kind: "mermaid", chart: koChart }] },
    {
      label: "PROS — 장점",
      title: "이 구조가 좋은 이유",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "신규/구 유저 판단이 사용자 타입 필드와 레코드 존재 여부 두 단계로 나뉘어 있어, 데이터가 없는 예외 상황도 자연스럽게 처리된다.",
            "실패에 관대한 설계 덕분에 마이그레이션 레코드 생성 실패 등이 회원가입·로그인 자체를 막지 않는다.",
            "이메일 인증에 세밀한 레이트리밋이 걸려 있어 무차별 대입·스팸 인증 시도를 억제한다.",
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
            "차단 도메인 초기화가 일부 진입점에서만 실행돼, 경로에 따라 정책이 일관되게 적용되지 않는다.",
            "이미 레코드가 있는 사용자는 마이그레이션을 다시 완료해도 상태가 갱신되지 않는다 — 의도(생성 또는 업데이트)와 실제 동작(생성만)이 다르다.",
            "재시도 횟수(retry_count) 필드가 스키마에는 있지만 실제로는 어디서도 증가하지 않는다 — 죽은 필드로 남아 있다.",
            "마이그레이션 레코드를 읽고 쓰는 구간에 동시성 잠금이 없어, 이론적으로는 동시 요청 시 경쟁 상태가 발생할 수 있다.",
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
            "차단 도메인 검사를 모든 로그인·마이그레이션 진입점에 동일하게 적용한다.",
            "이미 존재하는 마이그레이션 레코드도 완료 시점에 상태를 갱신하도록 고쳐, 의도한 동작과 실제 동작을 일치시킨다.",
            "죽은 retry_count 필드를 실제 재시도 로직에 연결하거나, 안 쓸 거면 스키마에서 정리한다.",
            "마이그레이션 레코드 조회~생성 구간에 유니크 제약이나 낙관적 잠금을 추가해 동시 요청 경쟁을 방지한다.",
          ],
        },
      ],
    },
  ],
};

const en: NoteBody = {
  intro: "The flow for moving old users — who signed up with their own id/password — onto an external identity provider (Firebase) scheme.",
  sections: [
    {
      label: "PURPOSE",
      title: "Why it's needed",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The new auth server delegates the login decision to an external identity provider and the internal DB holds only the mapping. But old users have no external account to begin with, so a one-time linking step is needed at the moment they try to log in. New sign-ups enter the new scheme from the start and need none of this.",
          ],
        },
      ],
    },
    {
      label: "HOW",
      title: "The runtime flow",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "Pre-check (optional)", body: "Before pressing the SNS login button, query migration status by email/id to decide whether to prompt sign-up." },
            { title: "Re-verify on login attempt", body: "When the actual login request arrives, the server re-checks the migration record. If there's no record or it isn't completed, it responds that migration is needed." },
            { title: "Email verification", body: "Enter a separate front-end flow and obtain an email-verified identity through the external provider (Firebase)." },
            { title: "Verify the identity token", body: "The auth server verifies the token's authenticity and checks that the DB email matches the token email." },
            { title: "Link the account", body: "With email verification complete, store it in the external-account link table. A firebase account already linked to another user is treated as a failure." },
            { title: "Complete migration", body: "Only when no migration record existed is a new one created and marked COMPLETED. If a record already exists (e.g. previously FAILED), the status is left unchanged." },
          ],
        },
      ],
    },
    {
      label: "KEY POINTS",
      title: "Core design points",
      blocks: [
        {
          kind: "keypoints",
          items: [
            { icon: ListChecks, title: "There are only three migration states", body: "Managed as NA (not applicable), COMPLETED, and FAILED only. There's no intermediate state like PENDING." },
            { icon: UserCog, title: "User type (NEW/OLD) comes first; a missing record is the exception case", body: "When a record exists, the user-type field decides first. Only when there's no record at all is the user implicitly treated as old." },
            { icon: ShieldAlert, title: "Blocked-domain reset runs at only some entry points", body: "It resets automatically on the login-attempt and status-query paths, but the migration handler itself and the password-login path don't go through this check." },
            { icon: ShieldCheck, title: "Email verification has strict rate limits", body: "10 per 24h, 30s between resends, code valid 5 minutes, 30-minute lock after 5 failures — all managed in Redis." },
            { icon: Link2, title: "1 user = 1 firebase account by rule; multiple SNS links allowed", body: "Email and firebase account link one-to-one per user, but SNS links like Google/Facebook/Apple are allowed in multiples at once and synced with firebase as the source of truth." },
          ],
        },
      ],
    },
    { label: "DIAGRAM", title: "Sequence diagram", blocks: [{ kind: "mermaid", chart: enChart }] },
    {
      label: "PROS",
      title: "Why this design is good",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "The new/old decision splits into two steps — the user-type field and record existence — so the no-data exception is handled naturally.",
            "A failure-tolerant design means things like a failed migration-record creation don't block sign-up or login themselves.",
            "Fine-grained rate limits on email verification curb brute-force and spam verification attempts.",
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
            "Blocked-domain reset runs at only some entry points, so the policy isn't applied consistently across paths.",
            "For users who already have a record, re-completing migration doesn't update the status — the intent (create or update) differs from the actual behavior (create only).",
            "The retry_count field exists in the schema but is never actually incremented anywhere — it remains a dead field.",
            "There's no concurrency lock across the read-then-write of the migration record, so concurrent requests could, in theory, race.",
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
            "Apply the blocked-domain check identically at every login and migration entry point.",
            "Fix it so an existing migration record's status is updated at completion too, aligning intended and actual behavior.",
            "Wire the dead retry_count field into real retry logic, or drop it from the schema if unused.",
            "Add a unique constraint or optimistic lock across the record's read-to-create window to prevent concurrent-request races.",
          ],
        },
      ],
    },
  ],
};

const content: NoteContent = { ko, en };
export default content;
