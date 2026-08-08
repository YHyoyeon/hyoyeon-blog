import { CheckCircle2, AlertTriangle, Lightbulb, Ban, Link2, ListOrdered, Search, SplitSquareHorizontal } from "lucide-react";
import type { NoteBody, NoteContent } from "@/lib/note-content";

const koTree = `apps/        서비스 단위 (독립 배포 대상)
  auth/          인증 서버
  auth-ui/       인증 관련 프론트엔드
  web/           일반 서비스 API
  admin/         관리자 API
  admin-ui/      관리자 프론트엔드
  billing/       결제 API
  billing-webhook/    결제 웹훅 수신 (AWS Lambda)
  ses-bounce-webhook/ 이메일 반송 처리 (AWS Lambda)
  test-board/    (개발/테스트용)

packages/     여러 서비스가 공유하는 코드 (그 자체로는 배포되지 않음)
  auth-core/     인증/토큰/쿠키/세션 공통 로직
  db-core/       DB 리포지토리/스토어드 프로시저 접근 레이어
  express-core/  Express 공통 미들웨어/라우팅/응답 포맷
  redis/         Redis 연결 공통 래퍼
  config/        환경별 설정값 (환경변수 매핑)
  types/         공유 타입/에러코드/응답 포맷 정의
  logger/        공통 로거
  utils/         범용 유틸리티
  aws-core/      AWS 서비스(S3 등) 래퍼
  shared/        기타 공유 리소스`;

const enTree = `apps/        service units (independently deployed)
  auth/          auth server
  auth-ui/       auth-related frontend
  web/           general service API
  admin/         admin API
  admin-ui/      admin frontend
  billing/       payments API
  billing-webhook/    payment webhook receiver (AWS Lambda)
  ses-bounce-webhook/ email bounce handling (AWS Lambda)
  test-board/    (dev/testing)

packages/     code shared across services (never deployed by itself)
  auth-core/     shared auth/token/cookie/session logic
  db-core/       DB repository / stored-procedure access layer
  express-core/  shared Express middleware/routing/response formats
  redis/         shared Redis connection wrapper
  config/        per-environment settings (env-var mapping)
  types/         shared types/error codes/response formats
  logger/        shared logger
  utils/         general utilities
  aws-core/      AWS service (S3 etc.) wrappers
  shared/        other shared resources`;

const ko: NoteBody = {
  intro: "pnpm workspace 기반으로 apps와 packages를 분리한 모노레포 구조와 의존성 관리 방식을 정리했습니다.",
  sections: [
    {
      label: "PURPOSE — 목적",
      title: "왜 이런 구조인가",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "인증, 결제, 운영툴 등 여러 서비스가 로그인 세션 검증 같은 로직을 공통으로 필요로 했습니다. 서비스마다 같은 로직을 따로 구현하면 중복과 불일치가 생기기 쉬워, 공유 로직을 packages로 끌어올리고 apps는 그것만 참조하는 구조로 정리했습니다.",
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
            { title: "레이어 구분", body: "apps는 배포 단위, packages는 공유 로직으로 나눈다. apps끼리는 서로 참조하지 않는다." },
            { title: "의존성 선언", body: `package.json에 "@softnyx/auth-core": "workspace:*" 처럼 선언하면 pnpm이 로컬 심볼릭 링크로 연결한다.` },
            { title: "패키지 빌드", body: "각 패키지는 tsc -b로 dist를 만든다. 루트의 빌드 스크립트가 워크스페이스 전체를 순회하며 의존 순서를 해결한다." },
            { title: "타입 해석", body: "tsconfig의 path mapping이 dist → src → apps/*/src 순서로 @softnyx/*를 찾는다." },
            { title: "로컬 실행", body: "서비스별 스크립트로 개별 실행하거나, Docker Compose profile로 필요한 조합만 골라 띄운다." },
            { title: "새 로직 추가", body: "2개 이상 앱에서 필요하면 packages에 만들고, 한 서비스 전용이면 apps/*/src 안에 그냥 둔다." },
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
            { icon: Ban, title: "apps는 서로를 직접 참조하지 않는다", body: "공유가 필요한 로직은 반드시 packages로 끌어올린다. auth·web·billing·admin이 모두 세션 검증이 필요하지만, 그 로직은 auth-core 하나에만 있다." },
            { icon: Link2, title: "workspace:* 가 로컬 링크를 만든다", body: "package.json에서 다른 패키지를 workspace:*로 선언하면 pnpm이 로컬 심볼릭 링크로 연결한다. 버전을 맞추거나 따로 배포할 필요가 없다." },
            { icon: ListOrdered, title: "빌드 순서가 중요하다", body: "패키지는 tsc -b로 dist를 만든다. 의존하는 패키지의 dist가 먼저 갱신돼 있어야 그 위의 앱이 정상 동작한다." },
            { icon: Search, title: "타입 해석은 dist를 우선한다", body: "tsconfig의 path mapping이 packages/*/dist → packages/*/src → apps/*/src 순서로 찾는다. 빌드 전에도 에디터 타입 추적이 소스까지 자연스럽게 이어진다." },
            { icon: SplitSquareHorizontal, title: "프론트엔드·Lambda는 빌드 파이프라인이 다르다", body: "auth-ui·admin-ui와 billing-webhook·ses-bounce-webhook은 공통 빌드/린트 대상에서 의도적으로 제외된다. 배포 방식이 API 서버들과 다르기 때문이다." },
          ],
        },
      ],
    },
    { label: "STRUCTURE — 구조", title: "apps vs packages", blocks: [{ kind: "code", code: koTree }] },
    {
      label: "PROS — 장점",
      title: "이 구조가 좋은 이유",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "공유 로직이 packages 한 곳에만 있어 여러 서비스에서 인증·DB 접근 로직을 중복 구현하지 않는다.",
            "workspace:* 로컬 링크 덕분에 패키지 변경 사항이 별도 배포 없이 즉시 반영된다.",
            "서비스별·조합별로 실행 단위를 유연하게 고를 수 있어 로컬 개발 속도가 빠르다.",
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
            "의존 패키지를 빌드하지 않으면 앱이 이전 dist를 참조한다. 코드를 고쳤는데 반영이 안 되는 혼란이 생기기 쉽다.",
            "패키지가 늘어날수록 빌드 순서 해석이 복잡해지고, 전체 빌드 시간도 함께 늘어난다.",
            "프론트엔드·Lambda가 공통 파이프라인에서 빠져 있어, 저장소 전체 상태를 한 번에 검증하기 어렵다.",
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
            "패키지 변경 시 의존 앱의 dist 최신 여부를 자동으로 감지해 경고해주는 워치 스크립트를 추가한다.",
            "빌드 시간이 늘어나는 패키지는 Turborepo·Nx 같은 캐싱 도구를 도입해 증분 빌드로 전환한다.",
            "프론트엔드·Lambda도 공통 린트 규칙만이라도 공유해 저장소 전체의 코드 스타일 일관성을 높인다.",
          ],
        },
      ],
    },
  ],
};

const en: NoteBody = {
  intro: "The monorepo layout that splits apps from packages on a pnpm workspace, and how its dependencies are managed.",
  sections: [
    {
      label: "PURPOSE",
      title: "Why this structure",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Several services — auth, payments, ops tools — all needed logic like login-session verification. Implementing the same logic separately per service breeds duplication and drift, so shared logic was hoisted into packages and apps only reference it.",
          ],
        },
      ],
    },
    {
      label: "HOW",
      title: "How it works",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "Layer split", body: "apps are deploy units; packages are shared logic. Apps never reference each other." },
            { title: "Dependency declaration", body: `Declaring "@softnyx/auth-core": "workspace:*" in package.json makes pnpm wire it up as a local symlink.` },
            { title: "Package builds", body: "Each package builds its dist with tsc -b. The root build script walks the whole workspace resolving dependency order." },
            { title: "Type resolution", body: "tsconfig path mapping resolves @softnyx/* in dist → src → apps/*/src order." },
            { title: "Local runs", body: "Run services individually with per-service scripts, or pick just the combination you need with Docker Compose profiles." },
            { title: "Adding new logic", body: "If 2+ apps need it, put it in packages; if it's for one service only, it just lives in apps/*/src." },
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
            { icon: Ban, title: "Apps never reference each other directly", body: "Logic that needs sharing must be hoisted into packages. auth, web, billing, and admin all need session verification, but that logic exists only in auth-core." },
            { icon: Link2, title: "workspace:* creates local links", body: "Declare another package as workspace:* in package.json and pnpm connects it with a local symlink. No version pinning, no separate publishing." },
            { icon: ListOrdered, title: "Build order matters", body: "Packages build dist with tsc -b. The dist of a dependency must be refreshed first for the app above it to work correctly." },
            { icon: Search, title: "Type resolution prefers dist", body: "tsconfig path mapping searches packages/*/dist → packages/*/src → apps/*/src, so editor type navigation flows through to source even before a build." },
            { icon: SplitSquareHorizontal, title: "Frontends and Lambdas use a different build pipeline", body: "auth-ui/admin-ui and billing-webhook/ses-bounce-webhook are deliberately excluded from the common build/lint targets because they deploy differently from the API servers." },
          ],
        },
      ],
    },
    { label: "STRUCTURE", title: "apps vs packages", blocks: [{ kind: "code", code: enTree }] },
    {
      label: "PROS",
      title: "Why this design is good",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "Shared logic lives in one place — packages — so auth and DB access logic aren't re-implemented across services.",
            "Thanks to workspace:* local links, package changes take effect immediately with no separate publish.",
            "Run units can be picked flexibly per service or combination, keeping local development fast.",
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
            "If a dependency package isn't rebuilt, apps reference the stale dist — an easy source of 'I changed the code but nothing happened' confusion.",
            "As packages grow, build-order resolution gets more complex and total build time grows with it.",
            "With frontends and Lambdas outside the common pipeline, it's hard to verify the whole repo's state in one pass.",
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
            "Add a watch script that detects and warns when a dependent app's dist is stale after a package change.",
            "For packages with growing build times, adopt a caching tool like Turborepo/Nx and switch to incremental builds.",
            "Share at least the common lint rules with frontends and Lambdas to raise repo-wide code-style consistency.",
          ],
        },
      ],
    },
  ],
};

const content: NoteContent = { ko, en };
export default content;
