import { CheckCircle2, AlertTriangle, Lightbulb, Layers, RefreshCw, ScanLine, KeyRound, Siren } from "lucide-react";
import type { NoteBody, NoteContent } from "@/lib/note-content";

const koChart = `sequenceDiagram
    autonumber
    participant Chain as 체인 (RPC 노드)
    participant Indexer as 이벤트 크롤러
    participant RawDB as 원본 트랜잭션 저장소
    participant PostCrawler as 후처리 크롤러
    participant HistoryDB as 조회용 이력 저장소

    loop 컨트랙트별로 각자 독립된 주기 (기본 10초, 밀린 만큼 있으면 1초로 단축)
        Indexer->>Chain: 마지막으로 처리한 블록 이후 ~ 최신 블록(승인 대기 블록수 제외) 구간 이벤트 조회
        Chain-->>Indexer: 이벤트 로그 목록
        Indexer->>Chain: 이벤트가 있으면 트랜잭션 원문 + 영수증 조회
        Chain-->>Indexer: 트랜잭션 + 영수증
        Indexer->>RawDB: upsert (해시 기준 - 나중에 같은 트랜잭션이 다시 잡혀도 덮어씀)
        Indexer->>Indexer: 처리한 마지막 블록 번호를 저장 (재시작해도 이어서 진행)
    end

    loop 별도의 독립 주기 (미처리 건 있으면 100ms, 없으면 10초)
        PostCrawler->>RawDB: 아직 후처리 안 된(processedAt=null) 트랜잭션 1건 조회
        RawDB-->>PostCrawler: 트랜잭션 (로그 포함)
        PostCrawler->>PostCrawler: 각 로그를 컨트랙트 ABI로 디코딩\\n(Transfer/Lock/Unlock 등 → mint/burn/transfer/lock/unlock 같은 사람이 읽을 수 있는 설명으로 변환)
        PostCrawler->>HistoryDB: 정규화된 이력 레코드 저장
        PostCrawler->>RawDB: processedAt 채워서 처리 완료 표시
    end`;

const enChart = `sequenceDiagram
    autonumber
    participant Chain as Chain (RPC node)
    participant Indexer as Event crawler
    participant RawDB as Raw transaction store
    participant PostCrawler as Post-processing crawler
    participant HistoryDB as Query history store

    loop independent cycle per contract (default 10s, shortened to 1s when behind)
        Indexer->>Chain: query events from last processed block up to the latest (minus confirmation-wait blocks)
        Chain-->>Indexer: event log list
        Indexer->>Chain: if events exist, fetch transaction body + receipt
        Chain-->>Indexer: transaction + receipt
        Indexer->>RawDB: upsert (keyed by hash - re-caught transactions just overwrite)
        Indexer->>Indexer: save the last processed block number (resumes after restart)
    end

    loop separate independent cycle (100ms when backlog exists, 10s otherwise)
        PostCrawler->>RawDB: fetch 1 not-yet-processed (processedAt=null) transaction
        RawDB-->>PostCrawler: transaction (with logs)
        PostCrawler->>PostCrawler: decode each log with the contract ABI\\n(Transfer/Lock/Unlock etc → human-readable mint/burn/transfer/lock/unlock)
        PostCrawler->>HistoryDB: store normalized history record
        PostCrawler->>RawDB: set processedAt to mark done
    end`;

const ko: NoteBody = {
  intro: "이름만 보면 체인 탐색기처럼 보이지만, 실제로는 인덱서·서명 허브·운영자 워커 세 역할을 겸하는 서비스의 구조를 정리했습니다.",
  sections: [
    {
      label: "PURPOSE — 목적",
      title: "왜 직접 인덱서를 만들었나",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "체인에서 일어난 일(발행·판매·오퍼 등)을 마켓·게임 서버가 알아채려면 결국 누군가는 이벤트를 긁어와야 합니다. 여러 서비스가 각자 체인을 직접 조회하는 대신, 인덱서 하나가 이벤트를 모아 조회하기 쉬운 형태로 저장하고 다른 서비스는 그걸 물어보기만 하는 구조로 만들었습니다.",
          ],
        },
      ],
    },
    {
      label: "HOW — 구현 방법",
      title: "두 단계 크롤링과 겸임 역할",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "1단계: 이벤트 크롤러", body: "마지막으로 처리한 블록 이후부터 최신 블록(승인 대기 블록 수 제외) 구간의 이벤트를 조회하고, 트랜잭션 원문·영수증을 해시 기준으로 upsert한다." },
            { title: "블록 범위·속도 자동 조절", body: "RPC 제공자의 블록 범위 제한에 걸리면 다음 시도부터 범위를 절반으로 줄인다. 최신 블록과 많이 벌어지면(예: 15분 이상) 폴링 간격을 짧게 당긴다." },
            { title: "2단계: 후처리 크롤러", body: "아직 후처리 안 된 트랜잭션을 조회해 로그를 컨트랙트 ABI로 디코딩하고, mint·burn·transfer 같은 사람이 읽을 수 있는 이력으로 저장한다." },
            { title: "서명 허브 겸임", body: "여러 체인의 운영자 개인키를 메모리에 들고 있다가, REST 요청이 오면 민팅·거래·브릿지 등 다양한 EIP-712 서명을 즉석에서 만들어 응답한다." },
            { title: "운영자 워커 겸임", body: "별도 반복 타이머로 돌면서 난수 이행, 브릿지 민팅, 배치 송금, 만료 오퍼 정리 같은 운영자 전용 후속 조치를 대신 실행한다." },
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
            { icon: Layers, title: "이름은 인덱서지만 실제로는 3가지 역할을 겸한다", body: "체인 이벤트를 긁어와 저장하는 인덱서, 운영자 개인키로 EIP-712 서명을 대신 만들어주는 서명 허브, 난수 이행·브릿지 민팅 같은 후속 작업을 처리하는 운영자 워커가 한 프로세스 안에 함께 있다." },
            { icon: ScanLine, title: "컨트랙트마다 완전히 독립된 크롤링 루프를 돈다", body: "캐릭터NFT·아이템NFT·마켓·리워드·토큰·랜덤박스 등 감시 대상마다 각자 마지막 처리 블록을 따로 기억한다. 한 컨트랙트가 밀려도 다른 컨트랙트는 영향받지 않는다." },
            { icon: RefreshCw, title: "2단계 크롤링으로 책임을 분리했다", body: "1단계(이벤트 크롤러)는 체인에서 데이터를 놓치지 않고 가져오는 데만 집중하고, 2단계(후처리 크롤러)는 원본을 사람이 읽을 수 있는 이력으로 해석하는 데만 집중한다." },
            { icon: KeyRound, title: "같은 원본을 소비자마다 다른 목적으로 다시 읽는다", body: "마켓 API 서버가 같은 원본 트랜잭션 저장소를 별도 폴링 루프로 직접 읽어, 인덱서의 '범용 활동 이력'과는 다른 '판매 체결·오퍼 취소' 같은 비즈니스 상태로 재해석한다." },
            { icon: Siren, title: "인덱싱만 죽는 것과 전부 죽는 것은 장애 등급이 다르다", body: "인덱싱만 멈추면 조회 API가 오래된 데이터를 보여주는 정도지만, 서명·워커 기능까지 같이 죽으면 민팅·거래·랜덤박스 개봉 같은 진행 중인 흐름 전체가 멈춘다." },
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
            "1단계(수집)와 2단계(해석)를 분리해, 둘 중 하나가 느려지거나 죽어도 다른 하나는 자기 몫을 계속 진행할 수 있다.",
            "컨트랙트별 독립 크롤러 구조라 하나가 밀려도 전체 인덱싱이 멈추지 않는다.",
            "원본 저장 upsert + processedAt 플래그로 재시작·중복 이벤트에도 멱등성이 보장된다.",
            "여러 서비스가 체인을 직접 조회하지 않고 이 인덱서 하나에만 물어보면 되어, 조회 경로가 단순하다.",
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
            "인덱서·서명 허브·운영자 워커가 한 프로세스에 묶여 있어, 배포·장애 대응 시 셋을 분리해서 다루기 어렵다.",
            "서명 허브가 운영자 개인키를 메모리에 들고 있다 — 이 프로세스 하나가 여러 체인의 민팅·거래·브릿지 서명 권한을 전부 쥐고 있는 셈이다.",
            "인덱서와 마켓 서버가 같은 원본을 각자 따로 디코딩한다 — 이벤트 처리 로직을 고칠 때 어느 쪽 소비자를 위한 변경인지 항상 구분해야 한다.",
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
            "인덱싱·서명 허브·운영자 워커를 배포 단위로 분리해, 인덱싱 지연이 서명·워커 가용성에 영향을 주지 않도록 한다.",
            "운영자 개인키를 메모리 상주 방식 대신 KMS 등 외부 서명 서비스로 옮겨 단일 프로세스의 키 노출 범위를 줄인다.",
            "인덱서·마켓 서버의 이벤트 디코딩 로직을 공유 라이브러리로 통합해, 같은 트랜잭션을 두 번 따로 해석하지 않도록 한다.",
          ],
        },
      ],
    },
  ],
};

const en: NoteBody = {
  intro: "The name suggests a chain explorer, but it's really a service wearing three hats — indexer, signing hub, and operator worker. Here's its architecture.",
  sections: [
    {
      label: "PURPOSE",
      title: "Why build an indexer ourselves",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "For the market and game servers to notice what happened on-chain (mints, sales, offers, and so on), someone has to scrape the events eventually. Instead of every service querying the chain directly, one indexer collects events, stores them in an easy-to-query shape, and other services just ask it.",
          ],
        },
      ],
    },
    {
      label: "HOW",
      title: "Two-stage crawling and the extra hats",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "Stage 1: event crawler", body: "Query events from the last processed block up to the latest (minus confirmation-wait blocks) and upsert transaction bodies and receipts keyed by hash." },
            { title: "Auto-tuned block range and pace", body: "If the RPC provider's block-range limit is hit, the range is halved from the next attempt. When far behind the tip (e.g. 15+ minutes), the polling interval tightens." },
            { title: "Stage 2: post-processing crawler", body: "Fetch not-yet-processed transactions, decode their logs with the contract ABI, and store human-readable history like mint, burn, and transfer." },
            { title: "Signing hub on the side", body: "It holds operator private keys for several chains in memory and, on REST requests, produces various EIP-712 signatures — minting, trades, bridging — on the spot." },
            { title: "Operator worker on the side", body: "On separate repeating timers it executes operator-only follow-ups: randomness fulfillment, bridge minting, batch transfers, expired-offer cleanup." },
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
            { icon: Layers, title: "Called an indexer, but it wears three hats", body: "An indexer that scrapes and stores chain events, a signing hub that produces EIP-712 signatures with operator private keys, and an operator worker that handles follow-ups like randomness fulfillment and bridge minting — all in one process." },
            { icon: ScanLine, title: "Each contract runs a fully independent crawl loop", body: "Every watched target — character NFT, item NFT, market, reward, token, loot box — remembers its own last processed block. One contract falling behind doesn't affect the others." },
            { icon: RefreshCw, title: "Two-stage crawling separates responsibilities", body: "Stage 1 (event crawler) focuses only on fetching data from the chain without missing anything; stage 2 (post-processor) focuses only on interpreting the raw data into human-readable history." },
            { icon: KeyRound, title: "The same raw data is re-read by different consumers for different ends", body: "The market API server reads the same raw transaction store with its own polling loop, reinterpreting it into business states like 'sale settled' or 'offer canceled' — distinct from the indexer's general activity history." },
            { icon: Siren, title: "Indexing-only death and total death are different incident grades", body: "If only indexing stops, the query API just shows stale data; if the signing and worker functions die with it, every in-flight flow — minting, trades, loot-box opening — halts." },
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
            "Separating stage 1 (collection) from stage 2 (interpretation) lets either keep doing its share even if the other slows or dies.",
            "The per-contract independent crawler structure means one falling behind doesn't stall all indexing.",
            "Raw-store upserts + the processedAt flag guarantee idempotency across restarts and duplicate events.",
            "Services ask this one indexer instead of querying the chain directly, keeping the query path simple.",
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
            "Indexer, signing hub, and operator worker are bound into one process — hard to handle separately for deploys and incident response.",
            "The signing hub keeps operator private keys in memory — this single process effectively holds all minting/trade/bridge signing authority for several chains.",
            "The indexer and market server each decode the same raw data separately — every change to event-handling logic must be tagged for the right consumer.",
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
            "Split indexing, signing hub, and operator worker into separate deploy units so indexing lag can't hurt signing/worker availability.",
            "Move operator private keys out of resident memory into an external signing service like KMS to shrink the single process's key exposure.",
            "Unify the indexer's and market server's event-decoding logic into a shared library so the same transaction isn't interpreted twice separately.",
          ],
        },
      ],
    },
  ],
};

const content: NoteContent = { ko, en };
export default content;
