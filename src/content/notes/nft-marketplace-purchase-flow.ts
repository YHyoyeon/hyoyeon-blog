import { CheckCircle2, AlertTriangle, Lightbulb, SplitSquareHorizontal, Repeat2, ShieldCheck, Save, Ban } from "lucide-react";
import type { NoteBody, NoteContent } from "@/lib/note-content";

const koChart = `sequenceDiagram
    autonumber
    participant Buyer as 구매자 지갑
    participant Chain as 온체인 (Market 컨트랙트)
    participant Scan as kingdomScan (크롤러)
    participant Backend as 백엔드 (트랜잭션 인덱서)
    participant DB as 백엔드 DB

    Buyer->>Chain: TradeNFT(...) 직접 호출 (지갑 서명)
    Chain-->>Chain: 판매자 서명 검증, 소유권 이전, 이벤트 emit
    Chain-->>Buyer: tx 컨펌 (성공 모달 표시)

    loop 컨트랙트별 주기 폴링 (수 초 간격)
        Scan->>Chain: 블록 구간 이벤트 조회
        Chain-->>Scan: 로그 반환
        Scan-->>Scan: 원시 트랜잭션/로그 저장
    end

    loop 백엔드 트랜잭션 크롤러 (락 기반 틱)
        Backend->>Scan: 미처리 트랜잭션 조회 요청
        Scan-->>Backend: 트랜잭션 목록
        Backend-->>Backend: isProcessed(hash) 확인 (중복 방지)
        Backend-->>DB: 판매 목록/거래 이력 갱신, 알림 발행
    end`;

const enChart = `sequenceDiagram
    autonumber
    participant Buyer as Buyer wallet
    participant Chain as On-chain (Market contract)
    participant Scan as kingdomScan (crawler)
    participant Backend as Backend (transaction indexer)
    participant DB as Backend DB

    Buyer->>Chain: call TradeNFT(...) directly (wallet signature)
    Chain-->>Chain: verify seller signature, transfer ownership, emit event
    Chain-->>Buyer: tx confirmed (success modal shown)

    loop per-contract periodic polling (every few seconds)
        Scan->>Chain: query events in a block range
        Chain-->>Scan: return logs
        Scan-->>Scan: store raw transactions/logs
    end

    loop backend transaction crawler (lock-based tick)
        Backend->>Scan: request unprocessed transactions
        Scan-->>Backend: transaction list
        Backend-->>Backend: check isProcessed(hash) (dedup)
        Backend-->>DB: update listings/trade history, publish notifications
    end`;

const ko: NoteBody = {
  intro: "구매 트랜잭션이 온체인에서 먼저 확정되고, 두 단계의 오프체인 폴링을 거쳐서야 DB에 반영되는 동기화 구조를 정리했습니다.",
  sections: [
    {
      label: "PURPOSE — 목적",
      title: "왜 온체인과 DB 반영이 따로 노는가",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "마켓플레이스 프론트엔드는 '구매하기'를 누르면 사용자 지갑이 컨트랙트를 직접 호출하게 만들어져 있습니다. 이 시점에 백엔드는 개입하지 않고, 트랜잭션의 존재조차 모릅니다. 이런 구조이다 보니 '온체인 확정'과 'DB(판매 목록·소유자·거래 이력) 반영' 사이에 필연적으로 시차가 생기고, 이 시차를 메우는 것이 2단 폴링 인덱서입니다.",
          ],
        },
      ],
    },
    {
      label: "HOW — 구현 방법",
      title: "구매 시 쓰기/동기화 흐름",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "판매 등록", body: "판매자가 오프체인으로 등록하면 백엔드가 가격·통화·토큰ID·마감시각을 담은 EIP-712 서명(다이제스트)을 발급해 DB에 저장한다." },
            { title: "온체인 구매 호출", body: "구매자가 지갑으로 마켓 컨트랙트의 구매 함수를 직접 호출한다. 네이티브 코인 결제면 결제액을 함께 보낸다." },
            { title: "컨트랙트 검증 및 정산", body: "컨트랙트가 판매자 서명을 복원해 검증하고, 플랫폼 수수료를 정산한 뒤 NFT 소유권을 이전한다." },
            { title: "프론트엔드는 컨펌까지만 대기", body: "트랜잭션 컨펌을 기다렸다가 성공 모달을 띄운다. 과거에 있던 '구매 완료' 콜백은 현재 주석 처리되어 더 이상 호출되지 않는다." },
            { title: "인덱싱 허브 크롤러가 이벤트 수집", body: "컨트랙트별 독립 폴링 루프가 블록 구간 이벤트 로그를 가져와 저장하고, 마지막으로 읽은 블록 번호를 체크포인트로 기록한다." },
            { title: "백엔드 인덱서가 DB 반영", body: "락 하에 주기적으로 인덱싱 허브에 미처리 트랜잭션을 물어본 뒤, 이벤트·메서드 이름 기반 핸들러로 분기해 판매 목록·거래 이력을 갱신하고 알림을 발행한다. 처리 여부 확인으로 같은 트랜잭션의 중복 처리를 막는다." },
            { title: "(참고) 발행은 별도 경로", body: "게임 클라이언트가 인덱싱 허브에서 메타데이터 해시와 서명을 받아 발행 함수를 직접 호출한다. 마켓플레이스 프론트엔드 코드에도 이 호출 로직이 남아있지만 실제 서비스 경로가 아닌 주석 처리된 개발용 코드다." },
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
            { icon: SplitSquareHorizontal, title: "성공 모달과 DB 반영은 별개 이벤트다", body: "지갑 트랜잭션 컨펌은 즉시 알 수 있지만, DB 반영은 인덱서가 따라잡을 때까지 기다려야 한다." },
            { icon: Repeat2, title: "2단 폴링 구조", body: "인덱싱 허브가 먼저 원시 이벤트·로그를 수집하고, 백엔드가 그 위에서 다시 미처리 트랜잭션을 폴링해 비즈니스 로직을 처리한다." },
            { icon: ShieldCheck, title: "처리 여부 플래그로 멱등성 보장", body: "같은 트랜잭션이 여러 번 폴링에 걸려도 중복 처리되지 않는다." },
            { icon: Save, title: "체크포인트 기반 재시작 안전성", body: "크롤러가 죽었다 다시 떠도 마지막으로 저장된 블록 번호부터 이어서 읽는다." },
            { icon: Ban, title: "마켓플레이스는 민팅을 하지 않는다", body: "관련 코드는 죽은 개발용 코드로만 남아있고, 실제 발행은 게임 클라이언트·인덱싱 허브 경로로만 일어난다." },
          ],
        },
      ],
    },
    { label: "DIAGRAM — 시퀀스", title: "온체인 구매 → 오프체인 반영 시퀀스", blocks: [{ kind: "mermaid", chart: koChart }] },
    {
      label: "PROS — 장점",
      title: "이 구조가 좋은 이유",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "백엔드가 잠깐 죽어도 지갑-컨트랙트 간 거래 자체는 영향받지 않는다 — 결제 경로가 백엔드 가용성에 종속되지 않는다.",
            "컨트랙트별로 크롤러가 독립적이라, 한 컨트랙트 쪽 폴링 장애가 다른 컨트랙트로 전파되지 않는다.",
            "체크포인트와 처리 여부 플래그로 인덱서가 재시작돼도 유실·중복 없이 이어서 처리한다.",
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
            "온체인 확정과 DB 반영 사이에 시차(수 초~수십 초)가 있어, 구매 직후 마이페이지 등에서 잠깐 이전 상태가 보일 수 있다.",
            "프론트엔드가 더 이상 완료 콜백을 보내지 않아, DB에 실제로 반영됐는지를 프론트가 직접 알 방법이 없다 — 재조회·폴링에 의존해야 한다.",
            "인덱서가 인덱싱 허브와 백엔드 두 단계로 나뉘어 있어 장애 지점이 두 곳으로 늘어난다.",
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
            "트랜잭션 해시 기준으로 'DB 반영 완료'를 실시간으로 알려주는 웹소켓·푸시 채널을 도입한다.",
            "인덱싱 허브와 백엔드로 나뉜 두 단계 폴링의 역할을 더 명확히 하거나 통합해 장애 지점을 줄인다.",
            "오래 대기 상태로 남은 트랜잭션을 감지해 알림·재처리하는 대시보드를 마련한다.",
          ],
        },
      ],
    },
  ],
};

const en: NoteBody = {
  intro: "A sync design where the purchase transaction settles on-chain first and reaches the DB only after two stages of off-chain polling.",
  sections: [
    {
      label: "PURPOSE",
      title: "Why on-chain and the DB drift apart",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The marketplace front end is built so that pressing 'Buy' makes the user's wallet call the contract directly. The backend isn't involved at that moment — it doesn't even know the transaction exists. Given that, a gap between 'on-chain finality' and 'DB reflection' (listings, owners, trade history) is inevitable, and the two-stage polling indexer is what closes it.",
          ],
        },
      ],
    },
    {
      label: "HOW",
      title: "The write/sync flow on purchase",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "Listing registration", body: "When the seller registers off-chain, the backend issues an EIP-712 signature (digest) over price, currency, token id, and deadline, and stores it in the DB." },
            { title: "On-chain purchase call", body: "The buyer's wallet calls the market contract's purchase function directly, sending the payment along when paying in the native coin." },
            { title: "Contract verification and settlement", body: "The contract recovers and verifies the seller's signature, settles the platform fee, and transfers NFT ownership." },
            { title: "The front end waits only for confirmation", body: "It waits for the transaction confirmation and shows a success modal. The old 'purchase complete' callback is now commented out and no longer called." },
            { title: "Indexing-hub crawler collects events", body: "Per-contract independent polling loops fetch and store event logs by block range, checkpointing the last block read." },
            { title: "Backend indexer reflects into the DB", body: "Under a lock it periodically asks the indexing hub for unprocessed transactions, dispatches handlers by event/method name to update listings and trade history, and publishes notifications. A processed check prevents duplicate handling of the same transaction." },
            { title: "(Note) Minting is a separate path", body: "The game client obtains the metadata hash and signature from the indexing hub and calls the mint function directly. The marketplace front end still contains this call logic, but as commented-out dev code — not a live service path." },
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
            { icon: SplitSquareHorizontal, title: "The success modal and the DB update are separate events", body: "Wallet transaction confirmation is known instantly, but the DB update must wait for the indexer to catch up." },
            { icon: Repeat2, title: "Two-stage polling", body: "The indexing hub first collects raw events and logs, and the backend polls for unprocessed transactions on top of that to run the business logic." },
            { icon: ShieldCheck, title: "Idempotency via a processed flag", body: "The same transaction can be caught by polling multiple times without being processed twice." },
            { icon: Save, title: "Checkpoint-based restart safety", body: "Even if the crawler dies and comes back, it resumes reading from the last saved block number." },
            { icon: Ban, title: "The marketplace doesn't mint", body: "The related code survives only as dead dev code; actual minting happens only through the game-client / indexing-hub path." },
          ],
        },
      ],
    },
    { label: "DIAGRAM", title: "On-chain purchase → off-chain reflection", blocks: [{ kind: "mermaid", chart: enChart }] },
    {
      label: "PROS",
      title: "Why this design is good",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "Even if the backend goes down briefly, wallet-to-contract trades are unaffected — the payment path doesn't depend on backend availability.",
            "Crawlers are independent per contract, so a polling failure on one contract doesn't spread to the others.",
            "Checkpoints plus the processed flag let the indexer resume after restarts with no loss or duplication.",
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
            "The gap between on-chain finality and DB reflection (seconds to tens of seconds) means pages like My Page can briefly show the previous state right after a purchase.",
            "With the front end no longer sending a completion callback, it has no direct way to know the DB actually updated — it must rely on refetching/polling.",
            "The indexer being split into indexing hub and backend doubles the number of failure points.",
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
            "Introduce a websocket/push channel that reports 'DB reflected' in real time keyed by transaction hash.",
            "Clarify or merge the roles of the two polling stages split across the indexing hub and backend to reduce failure points.",
            "Build a dashboard that detects long-pending transactions and alerts/reprocesses them.",
          ],
        },
      ],
    },
  ],
};

const content: NoteContent = { ko, en };
export default content;
