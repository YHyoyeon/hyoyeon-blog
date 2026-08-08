import { CheckCircle2, AlertTriangle, Lightbulb, SplitSquareHorizontal, RadioTower, Clock, AlertOctagon, PowerOff } from "lucide-react";
import type { NoteBody, NoteContent } from "@/lib/note-content";

const koWebhook = `sequenceDiagram
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

const koPrepaid = `sequenceDiagram
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

const enWebhook = `sequenceDiagram
    autonumber
    participant Browser as Browser
    participant Billing as billing server
    participant PG as PG (provider A/B/D)
    participant Webhook as Webhook receiver Lambda
    participant DB as Payments database

    Browser->>Billing: payment request (product selected)
    Billing->>DB: validate product/user, create top-up record in pending state
    Billing-->>Browser: return payment form data or a payment token/URL
    Browser->>PG: go to the payment page (form submit or token-based redirect)
    Note over Browser,PG: user completes payment on the PG page
    PG->>Webhook: payment-complete webhook callback (direct server-to-server)
    Webhook->>Webhook: verify signature/checksum
    Webhook->>DB: mark the top-up record complete, grant cash (points)
    Webhook-->>PG: 200 OK
    Browser->>Billing: (optional) query completion/history
    Billing->>DB: read history
    Billing-->>Browser: payment status response`;

const enPrepaid = `sequenceDiagram
    autonumber
    participant Browser as Browser
    participant Billing as billing server
    participant DB as Payments database

    Browser->>Billing: enter card number + security code in 3 parts
    Billing->>DB: check recent input-error count (block excessive attempts)
    Billing->>DB: look up the card (validity, issue state, denomination)
    alt bad card state (unissued/blocked/already used/expired)
        Billing-->>Browser: unusable-card error
    else valid card
        Billing->>DB: check reseller/country allowance (only some card types)
        Billing->>DB: update card state to "used"
        Billing->>DB: record top-up history
        Billing->>DB: enqueue cash grant into a "pending table" (actual grant is a follow-up)
        Billing-->>Browser: result (amount to be granted, etc.)
    end`;

const ko: NoteBody = {
  intro: "하나의 billing 서비스 안에 호스팅 리다이렉트형·토큰 발급형·코드 검증형·레거시 SOAP형이 섞인 5개 PG 연동 구조를 정리했습니다.",
  sections: [
    {
      label: "PURPOSE — 목적",
      title: "왜 이렇게 제각각인가",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "billing 앱은 Skrill·Xsolla·Epin·Pinvalidda·Tigo 5개 결제 수단을 붙이고 있지만, 각 PG사가 요구하는 연동 패턴이 완전히 다릅니다. 하나의 결제 개념 안에 호스팅 리다이렉트·토큰 발급·코드 검증·레거시 SOAP 방식이 섞여 있어 신규 합류자가 헷갈리기 쉬운 지점을 정리했습니다.",
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
            { title: "결제 요청", body: "사용자가 상품을 선택하면 billing 서버가 상품·사용자 정보를 검증하고 충전 이력을 대기 상태로 만든다." },
            { title: "PG 페이지 이동", body: "Skrill은 폼 데이터를 만들어 결제 페이지로 그대로 POST하고, Xsolla는 토큰을 발급받아 그 토큰으로 결제창 URL을 구성한다." },
            { title: "웹훅 수신", body: "Skrill·Xsolla·Pinvalidda의 결제 완료 콜백은 billing 서버가 아니라 별도의 billing-webhook Lambda가 받는다." },
            { title: "상태 확정", body: "웹훅 Lambda가 서명·체크섬을 검증하고 충전 이력을 완료 상태로 갱신한다. 내부 오류가 나도 PG에는 200을 돌려줘 불필요한 재시도를 막고, 중복 웹훅은 별도로 걸러낸다." },
            { title: "Epin(선불 카드)은 예외", body: "리다이렉트·웹훅 없이 카드 번호와 보안코드를 그 자리에서 검증한다. 무료 쿠폰 경로는 지급을 대기 테이블에 적재하지만, 일반 카드 경로의 지급 처리는 아직 구현돼 있지 않다." },
            { title: "Pinvalidda(레거시 SOAP)", body: "XML 바디를 직접 문자열로 조립해 결제 참조번호를 발급받고, 세미콜론으로 구분된 커스텀 텍스트 응답을 별도 파서로 해석한다." },
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
            { icon: SplitSquareHorizontal, title: "결제 요청과 완료 확정이 물리적으로 분리돼 있다", body: "billing 서버가 결제 요청을 만들고, Skrill·Xsolla·Pinvalidda의 완료 웹훅은 별도의 billing-webhook Lambda가 받는다." },
            { icon: RadioTower, title: "웹훅은 항상 200을 돌려주고, 중복은 따로 걸러낸다", body: "내부 오류가 나도 일단 200을 응답해 PG의 불필요한 재시도를 억제한다. 이미 처리된 주문이 다시 오면 중복 처리 로직으로 조용히 무시한다." },
            { icon: Clock, title: "Epin(선불 카드)은 무료 쿠폰 경로만 대기 테이블에 쌓인다", body: "카드 검증까지는 동기로 처리하지만, 실제 캐시 지급은 무료 쿠폰 경로에서만 대기 테이블에 적재된다. 일반 카드 결제의 지급 처리는 TODO로 남아 아직 구현되지 않았다." },
            { icon: AlertOctagon, title: "Pinvalidda(레거시 SOAP) 연동은 체크섬 키가 하드코딩돼 있다", body: "콜롬비아·에콰도르·코스타리카 3개국 가맹점 설정이 코드에 그대로 박혀 있고, 위·변조 체크섬 계산에 쓰는 고정 키도 코드 안에 있다." },
            { icon: PowerOff, title: "Tigo(통신사 소액결제)는 코드 전체가 주석 처리돼 있다", body: "컨트롤러 라우팅이 꺼져 있고(enable: false), 서비스 로직은 전부 주석 처리됐다. API 문서에도 '현재 비활성화된 API'라고 명시돼 있다." },
          ],
        },
      ],
    },
    { label: "DIAGRAM — 웹훅형", title: "웹훅 기반 결제 흐름 (Skrill · Xsolla · Pinvalidda)", blocks: [{ kind: "mermaid", chart: koWebhook }] },
    { label: "DIAGRAM — 선불형", title: "선불 카드형 흐름 (Epin)", blocks: [{ kind: "mermaid", chart: koPrepaid }] },
    {
      label: "PROS — 장점",
      title: "이 구조가 좋은 이유",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "결제 요청 생성과 완료 확정을 분리해, PG 웹훅이 지연되거나 재시도돼도 billing 서버 자체는 영향받지 않는다.",
            "공통 기반 클래스로 로깅·rate limit·상품 캐싱을 통일해, PG가 늘어나도 반복 구현이 필요 없다.",
            "웹훅에서 항상 200을 반환해 PG의 불필요한 재시도를 억제하고, 중복 처리 방지 로직으로 멱등성을 확보한다.",
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
            "5개 PG가 SOAP·REST·동기 처리 등 서로 다른 프로토콜을 쓰고 있어, 신규 합류자가 전체 그림을 파악하는 데 시간이 걸린다.",
            "Pinvalidda(레거시 SOAP) 연동은 체크섬 키가 하드코딩돼 있어 설정 분리가 안 된 기술 부채로 남아 있다.",
            "상품 캐시 키에 통화(currency)가 빠져 있다 — 국가별로 통화가 다른 상품은 캐시가 뒤섞일 여지가 있다.",
            "Epin 일반 카드 결제의 캐시 지급 로직이 TODO로 남아 있어, 무료 쿠폰 경로 외에는 실제 지급이 완결되지 않는다.",
            "시크릿 관리 방식이 PG마다 다르다 — Xsolla는 Parameter Store에서 동적으로 가져오지만 Pinvalidda는 코드에 그대로 박혀 있다.",
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
            "Pinvalidda 체크섬 키를 Parameter Store 등 시크릿 매니저로 옮겨, Xsolla와 동일한 방식으로 통일한다.",
            "Epin 일반 카드 결제 경로의 캐시 지급 로직을 마저 구현한다.",
            "상품 캐시 키에 통화를 포함시켜, 국가·통화별로 정확히 분리되도록 고친다.",
            "Tigo(비활성화) 연동을 완성하거나, 계속 쓰지 않을 거라면 죽은 코드를 완전히 제거한다.",
          ],
        },
      ],
    },
  ],
};

const en: NoteBody = {
  intro: "One billing service integrating five PGs — hosted redirect, token issuance, code verification, and legacy SOAP all mixed together. A comparison of the five integration patterns.",
  sections: [
    {
      label: "PURPOSE",
      title: "Why is each one so different",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The billing app integrates five payment methods — Skrill, Xsolla, Epin, Pinvalidda, and Tigo — but each provider demands a completely different integration pattern. Hosted redirects, token issuance, code verification, and legacy SOAP all coexist inside one 'payment' concept, so this note maps out the spots that trip up newcomers.",
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
            { title: "Payment request", body: "When the user picks a product, the billing server validates the product and user, and creates a top-up record in a pending state." },
            { title: "Redirect to the PG page", body: "Skrill builds form data and POSTs it straight to the payment page; Xsolla issues a token and builds the checkout URL from it." },
            { title: "Webhook reception", body: "The completion callbacks for Skrill, Xsolla, and Pinvalidda land on a separate billing-webhook Lambda, not the billing server." },
            { title: "State finalization", body: "The webhook Lambda verifies the signature/checksum and marks the top-up record complete. Even on an internal error it returns 200 to the PG to suppress useless retries, and duplicate webhooks are filtered separately." },
            { title: "Epin (prepaid cards) is the exception", body: "No redirect or webhook — the card number and security code are verified on the spot. The free-coupon path enqueues the grant into a pending table, but the regular-card path's grant handling isn't implemented yet." },
            { title: "Pinvalidda (legacy SOAP)", body: "It assembles the XML body by string concatenation to get a payment reference number, and parses a semicolon-delimited custom text response with its own parser." },
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
            { icon: SplitSquareHorizontal, title: "Payment request and completion are physically separated", body: "The billing server creates the payment request, while a separate billing-webhook Lambda receives the completion webhooks for Skrill, Xsolla, and Pinvalidda." },
            { icon: RadioTower, title: "Webhooks always return 200; duplicates are filtered separately", body: "Even on an internal error it responds 200 to suppress useless PG retries. If an already-processed order arrives again, dedup logic silently ignores it." },
            { icon: Clock, title: "For Epin, only the free-coupon path lands in the pending table", body: "Card verification is synchronous, but the actual cash grant is enqueued only on the free-coupon path. The regular card payment's grant handling remains an unimplemented TODO." },
            { icon: AlertOctagon, title: "Pinvalidda's checksum key is hardcoded", body: "Merchant settings for Colombia, Ecuador, and Costa Rica sit directly in the code, and so does the fixed key used for the anti-tamper checksum." },
            { icon: PowerOff, title: "Tigo (carrier billing) is entirely commented out", body: "Controller routing is off (enable: false) and the service logic is fully commented out. The API docs also explicitly say 'currently disabled API'." },
          ],
        },
      ],
    },
    { label: "DIAGRAM — WEBHOOK", title: "Webhook-based flow (Skrill · Xsolla · Pinvalidda)", blocks: [{ kind: "mermaid", chart: enWebhook }] },
    { label: "DIAGRAM — PREPAID", title: "Prepaid-card flow (Epin)", blocks: [{ kind: "mermaid", chart: enPrepaid }] },
    {
      label: "PROS",
      title: "Why this design is good",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "Separating request creation from completion means delayed or retried PG webhooks don't affect the billing server itself.",
            "A common base class unifies logging, rate limiting, and product caching, so adding PGs doesn't require repeated implementation.",
            "Always returning 200 from webhooks suppresses useless PG retries, and dedup logic secures idempotency.",
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
            "Five PGs use different protocols — SOAP, REST, synchronous — so newcomers take time to grasp the whole picture.",
            "The Pinvalidda (legacy SOAP) integration hardcodes its checksum key — technical debt with no config separation.",
            "The product cache key omits currency — products with per-country currencies can get their caches mixed up.",
            "Epin's regular-card grant logic remains a TODO, so outside the free-coupon path the actual grant never completes.",
            "Secret management differs per PG — Xsolla pulls dynamically from Parameter Store while Pinvalidda's sits in the code.",
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
            "Move the Pinvalidda checksum key into a secrets manager like Parameter Store, matching Xsolla's approach.",
            "Finish the cash-grant logic for Epin's regular-card path.",
            "Include currency in the product cache key so caches split correctly per country/currency.",
            "Either complete the disabled Tigo integration or fully remove the dead code if it won't be used.",
          ],
        },
      ],
    },
  ],
};

const content: NoteContent = { ko, en };
export default content;
