import type { Metadata } from "next";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  SplitSquareHorizontal,
  RadioTower,
  Clock,
  AlertOctagon,
  PowerOff,
} from "lucide-react";
import { NoteHeader, NoteSection, KeyPointList, StepList, IconList } from "@/components/notes/NoteLayout";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import NoteNav from "@/components/notes/NoteNav";
import MermaidDiagram from "@/components/notes/MermaidDiagram";

export const metadata: Metadata = { title: "결제 플로우 (5개 PG 연동 방식 비교)" };

const webhookFlow = `sequenceDiagram
    autonumber
    participant Browser as 브라우저
    participant Billing as billing 서버
    participant PG as PG (A사/B사/D사)
    participant Webhook as 웹훅 수신 Lambda
    participant DB as 결제 데이터베이스

    Browser->>Billing: 결제 요청 (상품 선택)
    Billing->>DB: 상품/사용자 검증, 충전 이력을 대기 상태로 생성
    Billing-->>Browser: 결제 폼 데이터 또는 결제 토큰/URL 반환
    Browser->>PG: 결제 페이지로 이동 (폼 제출 또는 토큰 기반 리다이렉트)
    Note over Browser,PG: 사용자가 PG 페이지에서 결제 완료
    PG->>Webhook: 결제 완료 웹훅 콜백 (서버-서버 직접 통신)
    Webhook->>Webhook: 서명/체크섬 검증
    Webhook->>DB: 충전 이력을 완료 상태로 갱신, 캐시(포인트) 지급
    Webhook-->>PG: 200 OK
    Browser->>Billing: (선택) 결제 완료 여부/이력 조회
    Billing->>DB: 이력 조회
    Billing-->>Browser: 결제 상태 응답`;

const prepaidCardFlow = `sequenceDiagram
    autonumber
    participant Browser as 브라우저
    participant Billing as billing 서버
    participant DB as 결제 데이터베이스

    Browser->>Billing: 카드 번호 + 보안코드 3분할 입력
    Billing->>DB: 최근 일정 시간 내 입력 오류 횟수 확인 (과다 시도 차단)
    Billing->>DB: 카드 정보 조회 (유효성, 발행 상태, 금액 권종)
    alt 카드 상태 이상 (미발행/차단/이미 사용/만료)
        Billing-->>Browser: 사용 불가 에러
    else 정상 카드
        Billing->>DB: 리셀러/국가 허용 여부 확인 (일부 카드 종류만 해당)
        Billing->>DB: 카드 상태를 "사용됨"으로 업데이트
        Billing->>DB: 충전 이력 기록
        Billing->>DB: 캐시 지급을 "대기 테이블"에 적재 (실제 지급은 후속 처리)
        Billing-->>Browser: 처리 결과 (지급 예정 금액 등)
    end`;

const highlights = [
  {
    icon: SplitSquareHorizontal,
    title: "결제 요청과 완료 확정이 물리적으로 분리돼 있다",
    body: "billing 서버가 결제 요청을 만들고, Skrill·Xsolla·Pinvalidda의 완료 웹훅은 별도의 billing-webhook Lambda가 받는다.",
  },
  {
    icon: RadioTower,
    title: "웹훅은 항상 200을 돌려주고, 중복은 따로 걸러낸다",
    body: "내부 오류가 나도 일단 200을 응답해 PG의 불필요한 재시도를 억제한다. 이미 처리된 주문이 다시 오면 중복 처리 로직으로 조용히 무시한다.",
  },
  {
    icon: Clock,
    title: "Epin(선불 카드)은 무료 쿠폰 경로만 대기 테이블에 쌓인다",
    body: "카드 검증까지는 동기로 처리하지만, 실제 캐시 지급은 무료 쿠폰 경로에서만 대기 테이블에 적재된다. 일반 카드 결제의 지급 처리는 TODO로 남아 아직 구현되지 않았다.",
  },
  {
    icon: AlertOctagon,
    title: "Pinvalidda(레거시 SOAP) 연동은 체크섬 키가 하드코딩돼 있다",
    body: "콜롬비아·에콰도르·코스타리카 3개국 가맹점 설정이 코드에 그대로 박혀 있고, 위·변조 체크섬 계산에 쓰는 고정 키도 코드 안에 있다.",
  },
  {
    icon: PowerOff,
    title: "Tigo(통신사 소액결제)는 코드 전체가 주석 처리돼 있다",
    body: "컨트롤러 라우팅이 꺼져 있고(enable: false), 서비스 로직은 전부 주석 처리됐다. API 문서에도 '현재 비활성화된 API'라고 명시돼 있다.",
  },
];

const implementationSteps = [
  {
    title: "결제 요청",
    body: "사용자가 상품을 선택하면 billing 서버가 상품·사용자 정보를 검증하고 충전 이력을 대기 상태로 만든다.",
  },
  {
    title: "PG 페이지 이동",
    body: "Skrill은 폼 데이터를 만들어 결제 페이지로 그대로 POST하고, Xsolla는 토큰을 발급받아 그 토큰으로 결제창 URL을 구성한다.",
  },
  {
    title: "웹훅 수신",
    body: "Skrill·Xsolla·Pinvalidda의 결제 완료 콜백은 billing 서버가 아니라 별도의 billing-webhook Lambda가 받는다.",
  },
  {
    title: "상태 확정",
    body: "웹훅 Lambda가 서명·체크섬을 검증하고 충전 이력을 완료 상태로 갱신한다. 내부 오류가 나도 PG에는 200을 돌려줘 불필요한 재시도를 막고, 중복 웹훅은 별도로 걸러낸다.",
  },
  {
    title: "Epin(선불 카드)은 예외",
    body: "리다이렉트·웹훅 없이 카드 번호와 보안코드를 그 자리에서 검증한다. 무료 쿠폰 경로는 지급을 대기 테이블에 적재하지만, 일반 카드 경로의 지급 처리는 아직 구현돼 있지 않다.",
  },
  {
    title: "Pinvalidda(레거시 SOAP)",
    body: "XML 바디를 직접 문자열로 조립해 결제 참조번호를 발급받고, 세미콜론으로 구분된 커스텀 텍스트 응답을 별도 파서로 해석한다.",
  },
];

const pros = [
  "결제 요청 생성과 완료 확정을 분리해, PG 웹훅이 지연되거나 재시도돼도 billing 서버 자체는 영향받지 않는다.",
  "공통 기반 클래스로 로깅·rate limit·상품 캐싱을 통일해, PG가 늘어나도 반복 구현이 필요 없다.",
  "웹훅에서 항상 200을 반환해 PG의 불필요한 재시도를 억제하고, 중복 처리 방지 로직으로 멱등성을 확보한다.",
];

const cons = [
  "5개 PG가 SOAP·REST·동기 처리 등 서로 다른 프로토콜을 쓰고 있어, 신규 합류자가 전체 그림을 파악하는 데 시간이 걸린다.",
  "Pinvalidda(레거시 SOAP) 연동은 체크섬 키가 하드코딩돼 있어 설정 분리가 안 된 기술 부채로 남아 있다.",
  "상품 캐시 키에 통화(currency)가 빠져 있다 — 국가별로 통화가 다른 상품은 캐시가 뒤섞일 여지가 있다.",
  "Epin 일반 카드 결제의 캐시 지급 로직이 TODO로 남아 있어, 무료 쿠폰 경로 외에는 실제 지급이 완결되지 않는다.",
  "시크릿 관리 방식이 PG마다 다르다 — Xsolla는 Parameter Store에서 동적으로 가져오지만 Pinvalidda는 코드에 그대로 박혀 있다.",
];

const improvements = [
  "Pinvalidda 체크섬 키를 Parameter Store 등 시크릿 매니저로 옮겨, Xsolla와 동일한 방식으로 통일한다.",
  "Epin 일반 카드 결제 경로의 캐시 지급 로직을 마저 구현한다.",
  "상품 캐시 키에 통화를 포함시켜, 국가·통화별로 정확히 분리되도록 고친다.",
  "Tigo(비활성화) 연동을 완성하거나, 계속 쓰지 않을 거라면 죽은 코드를 완전히 제거한다.",
];

export default function PaymentFlows() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 md:px-8 py-16 md:py-24">
      <NoteHeader
        title="결제 플로우 (5개 PG 연동 방식 비교)"
        intro="하나의 billing 서비스 안에 호스팅 리다이렉트형·토큰 발급형·코드 검증형·레거시 SOAP형이 섞인 5개 PG 연동 구조를 정리했습니다."
      />

      <NoteSection label="PURPOSE — 목적" title="왜 이렇게 제각각인가">
        <p className="text-sm text-muted-foreground leading-relaxed break-keep">
          billing 앱은 Skrill·Xsolla·Epin·Pinvalidda·Tigo 5개 결제 수단을 붙이고 있지만, 각
          PG사가 요구하는 연동 패턴이 완전히 다릅니다. 하나의 결제 개념 안에 호스팅 리다이렉트·토큰
          발급·코드 검증·레거시 SOAP 방식이 섞여 있어 신규 합류자가 헷갈리기 쉬운 지점을 정리했습니다.
        </p>
      </NoteSection>

      <NoteSection label="HOW — 구현 방법" title="동작 흐름">
        <StepList steps={implementationSteps} />
      </NoteSection>

      <NoteSection label="KEY POINTS — 중요한 것" title="핵심 설계 포인트">
        <KeyPointList items={highlights} />
      </NoteSection>

      <NoteSection label="DIAGRAM — 시퀀스" title="시퀀스 다이어그램">
        <div className="space-y-10">
          <div>
            <h3 className="text-sm font-semibold mb-3">웹훅 기반 결제 흐름 (Skrill · Xsolla · Pinvalidda)</h3>
            <MermaidDiagram chart={webhookFlow} />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3">선불 카드형 흐름 (Epin)</h3>
            <MermaidDiagram chart={prepaidCardFlow} />
          </div>
        </div>
      </NoteSection>

      <NoteSection label="PROS — 장점" title="이 구조가 좋은 이유">
        <IconList items={pros} icon={CheckCircle2} tone="accent" />
      </NoteSection>

      <NoteSection label="CONS — 단점 · 트레이드오프" title="감수한 트레이드오프">
        <IconList items={cons} icon={AlertTriangle} tone="destructive" />
      </NoteSection>

      <NoteSection label="NEXT — 개선점" title="앞으로 개선하고 싶은 부분">
        <IconList items={improvements} icon={Lightbulb} tone="muted" />
      </NoteSection>
          <NoteNav slug="payment-flows" />
        </div>
      </main>
      <Footer />
    </>
  );
}
