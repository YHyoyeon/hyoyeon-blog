import type { Metadata } from "next";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Rocket,
  Route,
  Shapes,
  KeyRound,
  Layers,
} from "lucide-react";
import { NoteHeader, NoteSection, KeyPointList, StepList, IconList } from "@/components/notes/NoteLayout";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import NoteNav from "@/components/notes/NoteNav";

export const metadata: Metadata = { title: "Bun + Hono 사용기" };

const highlights = [
  {
    icon: Rocket,
    title: "서버 진입점이 Bun의 { fetch, port }로 매우 얇다",
    body: "listen()을 직접 호출하지 않는다. Hono 앱 자체가 표준 fetch(Request): Response 시그니처를 구현하고 있어, 서버를 띄우는 코드와 요청을 처리하는 코드가 완전히 분리된다.",
  },
  {
    icon: Shapes,
    title: "코드 생성 없이 타입 그대로 공유하는 RPC가 채택 핵심 이유였다",
    body: "API 라우트의 타입을 그대로 export해서 프론트에서 hono/client로 가져다 쓴다. OpenAPI 코드젠 없이도 응답 모양이 바뀌면 프론트 타입이 즉시 어긋난 것으로 잡힌다.",
  },
  {
    icon: KeyRound,
    title: "인증은 KMS·RSA가 아니라 환경변수 기반 HS256 대칭키다",
    body: "Firebase로 신원을 확인한 뒤 자체 JWT(HS256)를 발급한다. 인프라 쪽엔 KMS로 RSA 키를 관리할 준비가 되어 있는 흔적이 있어, 인프라와 애플리케이션 코드의 방식이 어긋나 있을 수 있다.",
  },
  {
    icon: Layers,
    title: "여러 API 앱이 공통 부트스트랩 헬퍼로 뼈대를 재사용한다",
    body: "로거 부착, 헬스체크, 에러 매핑 같은 공통 처리를 createServiceApp() 헬퍼로 감싸, web-api와 admin-api가 동일한 뼈대를 공유한다.",
  },
  {
    icon: Route,
    title: "Turborepo 캐시로 반복 빌드·린트·타입체크가 빠르다",
    body: "변경 없는 패키지는 캐시로 스킵된다. 모노레포가 커질수록 이 캐시 이점이 체감된다.",
  },
];

const implementationSteps = [
  {
    title: "API 서버 진입점",
    body: "index.ts에서 { fetch, port } 객체를 default export한다. Bun이 이를 서버로 인식해 실행한다.",
  },
  {
    title: "라우트를 서브 앱으로 분리",
    body: "auth-routes.ts, events-routes.ts 등 기능 단위로 별도의 Hono() 인스턴스를 만들고, 메인 앱에 route()로 마운트한다.",
  },
  {
    title: "타입 안전 RPC",
    body: "API 서버에서 ApiRpcType = typeof app을 export하고, 프론트에서 hono/client의 hc<ApiRpcType>()로 그대로 가져다 쓴다.",
  },
  {
    title: "미들웨어 조합",
    body: "hono-pino(구조화 로깅), hono/cors(오리진 함수 분기), hono/jwt(라우트 그룹 단위 검증)를 조합해 쓴다.",
  },
  {
    title: "인증 흐름",
    body: "Firebase로 신원을 확인한 뒤 자체 JWT(HS256)를 발급해 sessionStorage에 저장한다. Refresh Token은 별도 캐시에 저장해 1회성으로 소모한다.",
  },
];

const pros = [
  "빌드 없이 바로 실행된다 — bun run src/index.ts로 트랜스파일 단계 없이 곧장 돌아가 로컬 개발 루프가 눈에 띄게 짧다.",
  "Hono 앱이 표준 fetch 인터페이스라 이식성이 좋다 — 나중에 Bun이 아닌 다른 런타임으로 옮겨도 라우트 코드는 거의 손댈 일이 없다.",
  "bun test로 별도 Jest/Vitest 설치 없이 바로 테스트를 돌린다.",
  "타입 안전 RPC로 프론트-백엔드 계약 어긋남을 컴파일 타임에 잡는다 — API 응답 모양을 바꾸면 프론트 빌드가 바로 깨진다.",
  "Turborepo 캐시로 모노레포 빌드·린트·타입체크가 반복 작업에서 빠르다.",
];

const cons = [
  "Next.js 네이티브 애드온과 Bun 설치 경로가 충돌한다 — @next/swc, lightningcss, sharp 같은 모듈이 런타임 에러를 내, 결국 프론트 앱 하나만 Node+pnpm 이미지로 따로 빌드하는 예외가 생겼다.",
  "tsc -b와 tsc -p를 헷갈리면 Docker에서만 실패한다 — project references를 무시하는 tsc -p는 dist가 없는 Docker 환경에서만 타입 에러가 나 원인 파악이 오래 걸렸다.",
  ".dockerignore에 tsbuildinfo를 안 넣으면 증분 빌드가 조용히 스킵된다 — dist가 새로 생성되지 않은 채 빌드가 성공해버리는 유형이라 특히 까다로웠다.",
  "Bun workspace는 심볼릭 링크 방식이라 Docker 멀티스테이지 빌드에서 손이 많이 간다 — 루트 node_modules만 복사하면 @softnyx/* 모듈을 못 찾는다.",
  "패키지의 package.json에 main 필드가 없으면 dist가 있어도 resolve에 실패한다.",
  "생태계가 아직 Node 대비 좁다 — Node 네이티브 애드온에 의존하는 패키지를 만나면 예외 처리가 필요하다.",
];

const improvements = [
  "프론트 앱(admin-front)도 Bun 네이티브 애드온 문제가 해결되면 다시 통합해, 모노레포 전체를 하나의 런타임으로 되돌린다.",
  "인프라의 KMS·RSA 준비와 실제 코드의 HS256 방식 중 하나로 통일해 인프라-코드 간 불일치를 없앤다.",
  "tsc -b/tsc -p 혼용, tsbuildinfo 누락 같은 Docker 빌드 함정을 체크리스트나 CI 검증으로 자동화해 재발을 막는다.",
  "새 패키지 생성 시 package.json의 main 필드 체크를 린트·CI 규칙으로 강제한다.",
];

export default function BunHonoUsage() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 md:px-8 py-16 md:py-24">
          <NoteHeader
            title="Bun + Hono 사용기"
            intro="런타임·패키지매니저로 Bun을, API 프레임워크로 Hono v4를 쓴 Turborepo 모노레포에서 실제로 겪은 패턴과 장단점을 정리했습니다."
          />

          <NoteSection label="PURPOSE — 목적" title="왜 이 스택을 골랐나">
            <p className="text-sm text-muted-foreground leading-relaxed break-keep">
              가장 큰 이유는 주어진 개발 기간이 짧았다는 점이었습니다. 많은 AI 코딩 도구·플랫폼이 Bun을
              기본 런타임으로 채택하고 있어 AI를 적극 활용해 빠르게 구현하는 데 유리하다고 판단했습니다.
              여기에 코드 생성이나 별도 스키마 동기화 없이 API 라우트의 타입을 그대로 프론트에서 가져다
              쓸 수 있는 타입 안전 RPC도 함께 고려했습니다. 표준 fetch 인터페이스라 런타임에 종속되지
              않는다는 점도 이유였습니다.
            </p>
          </NoteSection>

          <NoteSection label="HOW — 구현 방법" title="실제 쓰인 패턴">
            <StepList steps={implementationSteps} />
          </NoteSection>

          <NoteSection label="KEY POINTS — 중요한 것" title="핵심 포인트">
            <KeyPointList items={highlights} />
          </NoteSection>

          <NoteSection label="PROS — 장점" title="이 스택이 좋았던 이유">
            <IconList items={pros} icon={CheckCircle2} tone="accent" />
          </NoteSection>

          <NoteSection label="CONS — 단점 · 트레이드오프" title="실제로 부딪힌 문제">
            <IconList items={cons} icon={AlertTriangle} tone="destructive" />
          </NoteSection>

          <NoteSection label="NEXT — 개선점" title="앞으로 개선하고 싶은 부분">
            <IconList items={improvements} icon={Lightbulb} tone="muted" />
          </NoteSection>

          <NoteNav slug="bun-hono-usage" />
        </div>
      </main>
      <Footer />
    </>
  );
}
