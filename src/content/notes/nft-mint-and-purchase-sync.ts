import { CheckCircle2, AlertTriangle, Lightbulb, Stamp, ShoppingCart, Repeat2, HandCoins, ShieldCheck } from "lucide-react";
import type { NoteBody, NoteContent } from "@/lib/note-content";

const koMint = `sequenceDiagram
    autonumber
    participant Game as 게임 서버 (레포 외부)
    participant Scan as 서명/인덱싱 허브
    participant IPFS as IPFS
    participant Wallet as 플레이어 지갑
    participant Chain as 체인 (NFT 컨트랙트)

    Note over Game: 게임 내에서 캐릭터/아이템 획득 확정 (오프체인 DB에 우선 기록)
    Game->>Scan: 메타데이터 + 대상 지갑주소 + 일련번호 전달 (발행/언락/봉인 등 종류 지정)
    Scan->>IPFS: 메타데이터 업로드
    IPFS-->>Scan: 콘텐츠 해시(URI)
    Scan->>Scan: EIP-712 서명 생성\\n(운영자 전용 개인키로 "이 URI를 이 지갑에 발행해도 된다" 서명)
    Scan-->>Game: {URI, 서명}
    Game-->>Wallet: (클라이언트 경유) URI + 서명 전달

    Wallet->>Chain: 발행 트랜잭션 제출 (URI, 서명, 일련번호) - 가스비는 지갑이 부담
    Chain->>Chain: 서명자가 등록된 운영자 주소와 일치하는지 검증\\n동일 일련번호 재사용 여부 확인
    Chain->>Chain: 신규 토큰 발행 → 지갑에 귀속
    Chain-->>Wallet: 발행 완료 (트랜잭션 영수증)`;

const koPurchase = `sequenceDiagram
    autonumber
    participant Seller as 판매자 지갑
    participant Market as 마켓 API 서버
    participant DB as 마켓 데이터베이스
    participant Buyer as 구매자 지갑
    participant Chain as 체인 (마켓 컨트랙트)

    Seller->>Seller: 판매 조건(가격, 통화, 유효기한)에 EIP-712 서명 (지갑 자체 서명, 무료)
    Seller->>Market: 리스팅 등록 요청 (조건 + 서명)
    Market->>Market: 서명이 실제로 이 판매자 지갑에서 나온 것인지 검증
    Market->>DB: 리스팅 저장 (아직 온체인 아님)

    Buyer->>Market: 리스팅 조회 → 구매 의사
    Market-->>Buyer: 판매자가 서명해둔 조건 그대로 전달
    Buyer->>Chain: 구매 트랜잭션 제출 (판매자 서명 + 결제 통화/금액 동봉) - 가스비는 구매자 부담
    Chain->>Chain: 판매자 서명 검증 (일반 지갑 서명 또는 스마트 계정 서명 둘 다 지원)
    Chain->>Chain: 판매자가 여전히 소유 중인지, 마켓에 전송 승인이 되어 있는지 확인
    Chain->>Chain: 결제 분배 (플랫폼 수수료 차감 후 판매자에게 지급) + NFT 소유권 이전\\n(한 트랜잭션 안에서 원자적으로 처리 - 결제만 되고 NFT는 안 넘어가는 일이 불가능)
    Chain-->>Buyer: 구매 완료, 판매 이벤트 기록`;

const koSync = `sequenceDiagram
    autonumber
    participant Chain as 체인
    participant Scan as 인덱싱 허브 (별도 서비스)
    participant ScanDB as 공유 트랜잭션 저장소
    participant Market as 마켓 API 서버
    participant MarketDB as 마켓 데이터베이스

    loop 주기적 폴링 (초 단위)
        Scan->>Chain: 최근 블록 범위의 이벤트 조회
        Chain-->>Scan: 발행/판매/오퍼 등 이벤트 로그
        Scan->>ScanDB: 트랜잭션 원본 + 로그 저장
    end

    loop 별도 주기 폴링
        Market->>ScanDB: 아직 처리 안 한 트랜잭션 조회 (마지막 처리 시각 이후)
        ScanDB-->>Market: 트랜잭션 목록
        Market->>Market: 이미 처리된 해시인지 확인 (중복 반영 방지)
        Market->>Market: 트랜잭션의 메서드/이벤트 이름으로 처리기 분기\\n(발행/판매/오퍼생성/오퍼수락/오퍼취소/브릿지 등)
        Market->>MarketDB: 해당하는 비즈니스 테이블 갱신 (판매 상태, 거래 로그 등)
        opt 판매 체결
            Market->>Market: 게임 쪽에 판매 완료 알림 발행 (best-effort)
        end
    end`;

const enMint = `sequenceDiagram
    autonumber
    participant Game as Game server (outside this repo)
    participant Scan as Signing/indexing hub
    participant IPFS as IPFS
    participant Wallet as Player wallet
    participant Chain as Chain (NFT contract)

    Note over Game: in-game acquisition confirmed (recorded off-chain first)
    Game->>Scan: send metadata + target wallet + serial (specifying mint/unlock/seal etc.)
    Scan->>IPFS: upload metadata
    IPFS-->>Scan: content hash (URI)
    Scan->>Scan: create EIP-712 signature\\n(operator-only key signs "this URI may be minted to this wallet")
    Scan-->>Game: {URI, signature}
    Game-->>Wallet: (via client) hand over URI + signature

    Wallet->>Chain: submit mint transaction (URI, signature, serial) - wallet pays gas
    Chain->>Chain: verify signer matches the registered operator address\\ncheck the serial hasn't been reused
    Chain->>Chain: mint new token → assign to wallet
    Chain-->>Wallet: mint complete (transaction receipt)`;

const enPurchase = `sequenceDiagram
    autonumber
    participant Seller as Seller wallet
    participant Market as Market API server
    participant DB as Market database
    participant Buyer as Buyer wallet
    participant Chain as Chain (market contract)

    Seller->>Seller: EIP-712-sign the sale terms (price, currency, expiry) - wallet self-signs, free
    Seller->>Market: request listing (terms + signature)
    Market->>Market: verify the signature really came from this seller wallet
    Market->>DB: store listing (not on-chain yet)

    Buyer->>Market: browse listings → intent to buy
    Market-->>Buyer: pass along the seller-signed terms as-is
    Buyer->>Chain: submit purchase transaction (seller signature + payment currency/amount) - buyer pays gas
    Chain->>Chain: verify the seller signature (plain wallet or smart-account signatures both supported)
    Chain->>Chain: check the seller still owns it and the market has transfer approval
    Chain->>Chain: distribute payment (platform fee deducted, rest to seller) + transfer NFT ownership\\n(atomically in one transaction - payment-without-NFT is impossible)
    Chain-->>Buyer: purchase complete, sale event recorded`;

const enSync = `sequenceDiagram
    autonumber
    participant Chain as Chain
    participant Scan as Indexing hub (separate service)
    participant ScanDB as Shared transaction store
    participant Market as Market API server
    participant MarketDB as Market database

    loop periodic polling (seconds)
        Scan->>Chain: query events in the recent block range
        Chain-->>Scan: mint/sale/offer event logs
        Scan->>ScanDB: store raw transactions + logs
    end

    loop separate polling cycle
        Market->>ScanDB: fetch unprocessed transactions (since last processed time)
        ScanDB-->>Market: transaction list
        Market->>Market: check hash not already processed (dedup)
        Market->>Market: dispatch handlers by method/event name\\n(mint/sale/offer-create/offer-accept/offer-cancel/bridge etc.)
        Market->>MarketDB: update the relevant business tables (sale status, trade log, ...)
        opt sale settled
            Market->>Market: publish sale-complete notification to the game side (best-effort)
        end
    end`;

const ko: NoteBody = {
  intro: "게임 서버가 마음대로 발행하고 DB에 기록하는 구조가 아니라, 소유권이 항상 온체인 트랜잭션으로 확정되도록 만든 발행·구매·동기화 흐름을 정리했습니다.",
  sections: [
    {
      label: "PURPOSE — 목적",
      title: "왜 이렇게 나눴나",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Web2 서버가 지갑의 개인키를 대신 쥐고 있지 않다는 게 핵심 전제입니다. 오프체인 서버들은 트랜잭션을 만들기 위한 자격(서명)을 발급하거나, 이미 일어난 트랜잭션을 뒤늦게 읽어와 자기 DB에 반영하는 역할만 하도록 설계했습니다.",
          ],
        },
      ],
    },
    {
      label: "HOW — 구현 방법",
      title: "발행부터 오프체인 반영까지",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "발행(Mint) — 서명 발급", body: "게임 서버가 메타데이터와 대상 지갑을 서명/인덱싱 허브에 전달하면, 허브가 IPFS에 메타데이터를 올리고 운영자 개인키로 EIP-712 서명을 만든다." },
            { title: "발행 트랜잭션", body: "플레이어 지갑이 URI와 서명으로 발행 트랜잭션을 직접 제출한다. 컨트랙트는 서명자가 등록된 운영자인지, 같은 일련번호가 재사용되지 않았는지 확인한 뒤 토큰을 발행한다." },
            { title: "구매(Market) — 리스팅", body: "판매자가 가격·통화·유효기한에 EIP-712 서명만 하고, 마켓 API 서버는 서명을 검증해 DB에 저장한다. 아직 온체인 트랜잭션은 아니다." },
            { title: "구매 트랜잭션", body: "구매자가 판매자 서명과 결제 금액을 동봉해 구매 트랜잭션을 제출한다. 결제 분배와 NFT 소유권 이전이 한 트랜잭션 안에서 원자적으로 처리된다." },
            { title: "오프체인 반영", body: "인덱싱 허브가 주기적으로 최근 블록의 이벤트를 긁어 저장하면, 마켓 서버가 별도 주기로 미처리 트랜잭션을 가져와 이미 처리된 해시인지 확인한 뒤 이벤트 종류별로 비즈니스 테이블을 갱신한다." },
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
            { icon: ShieldCheck, title: "서버는 지갑의 개인키를 대신 쥐고 있지 않다", body: "최종 소유권은 항상 온체인 트랜잭션으로 확정된다. 서버는 그 트랜잭션을 만들 자격(서명)을 발급하거나, 이미 일어난 트랜잭션을 뒤늦게 읽어와 DB에 반영하는 역할만 한다." },
            { icon: Stamp, title: "발행 승인은 무료, 실제 발행은 플레이어가 가스비를 낸다", body: "서버가 EIP-712 서명으로 '이 URI를 이 지갑에 발행해도 된다'만 증명하고, 실제 트랜잭션은 플레이어 지갑이 직접 쏜다. 서버가 모든 유저의 민팅 가스비를 부담할 필요가 없다." },
            { icon: ShoppingCart, title: "판매 리스팅은 오프체인, 결제·소유권 이전은 한 트랜잭션에서 원자적으로", body: "판매자는 조건에 서명만 하고 무료로 몇 번이든 올렸다 내렸다 할 수 있다. 실제 자금·소유권 이동은 구매 시점 단 한 번의 트랜잭션으로 원자적으로 처리돼, 결제만 되고 NFT는 안 넘어가는 상황이 구조적으로 불가능하다." },
            { icon: Repeat2, title: "온체인에서 있었던 일을 폴링 인덱서가 뒤늦게 DB에 되먹인다", body: "인덱싱 허브와 마켓 서버가 같은 원본 트랜잭션 로그를 각자 다른 목적으로 디코딩한다 — 인덱서는 범용 활동 이력을, 마켓 서버는 판매중·판매완료 같은 비즈니스 상태를 만든다." },
            { icon: HandCoins, title: "멱등성을 여러 층에서 각각 보장한다", body: "인덱싱 허브는 마지막 처리 블록 번호로, 마켓 서버는 트랜잭션 해시 단위 처리 완료 플래그로, 알림은 짧은 TTL 캐시로 중복 반영·중복 발송을 막는다." },
          ],
        },
      ],
    },
    { label: "DIAGRAM — 발행", title: "1. 발행(Mint)", blocks: [{ kind: "mermaid", chart: koMint }] },
    { label: "DIAGRAM — 구매", title: "2. 구매(Market)", blocks: [{ kind: "mermaid", chart: koPurchase }] },
    { label: "DIAGRAM — 동기화", title: "3. 오프체인 반영", blocks: [{ kind: "mermaid", chart: koSync }] },
    {
      label: "PROS — 장점",
      title: "이 구조가 좋은 이유",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "서버가 개인키를 들고 있지 않아, 서버가 뚫려도 유저 자산을 직접 탈취할 수 없다.",
            "발행 승인과 실제 발행 트랜잭션을 분리해, 서버가 모든 유저의 가스비를 대신 부담하지 않는다.",
            "구매는 결제와 소유권 이전이 한 트랜잭션에 묶여 있어, 돈만 나가고 아이템은 못 받는 상황이 컨트랙트 구조상 불가능하다.",
            "리스팅이 오프체인·무료라서 판매자가 가스비 걱정 없이 자유롭게 올렸다 내렸다 할 수 있다.",
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
            "같은 트랜잭션 로그를 인덱서와 마켓 서버가 각자 따로 디코딩한다 — 이벤트 처리 로직을 고칠 때 어느 쪽을 위한 변경인지 항상 구분해야 하는 중복 유지보수 비용이 있다.",
            "오프체인 반영이 폴링 기반이라, 체인에서 트랜잭션이 확정된 시점과 마켓 서버 DB에 반영되는 시점 사이에 지연이 생긴다.",
            "판매 체결 알림은 best-effort로 발행돼, 게임 쪽에 알림이 유실될 가능성을 완전히 배제하지 않는다.",
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
            "인덱서와 마켓 서버의 이벤트 디코딩 로직을 공유 라이브러리로 통합해 중복 해석을 없앤다.",
            "폴링 주기를 이벤트 기반(웹훅·구독)으로 바꿔 온체인 확정과 DB 반영 사이의 지연을 줄인다.",
            "best-effort 알림에 재시도·데드레터 큐를 추가해 유실 가능성을 낮춘다.",
          ],
        },
      ],
    },
  ],
};

const en: NoteBody = {
  intro: "Not a design where the game server mints at will and writes to its DB — ownership is always settled by an on-chain transaction. Here's the mint, purchase, and sync flow that makes that true.",
  sections: [
    {
      label: "PURPOSE",
      title: "Why split it this way",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The core premise is that no Web2 server holds a wallet's private key on its behalf. The off-chain servers are designed to do only two things: issue the credential (a signature) needed to create a transaction, or read transactions that already happened and reflect them into their own DBs after the fact.",
          ],
        },
      ],
    },
    {
      label: "HOW",
      title: "From mint to off-chain reflection",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "Mint — signature issuance", body: "The game server sends metadata and the target wallet to the signing/indexing hub; the hub uploads metadata to IPFS and creates an EIP-712 signature with the operator private key." },
            { title: "Mint transaction", body: "The player wallet submits the mint transaction itself with the URI and signature. The contract checks the signer is the registered operator and the serial hasn't been reused, then mints." },
            { title: "Market — listing", body: "The seller merely EIP-712-signs the price/currency/expiry, and the market API server verifies the signature and stores it in the DB. No on-chain transaction yet." },
            { title: "Purchase transaction", body: "The buyer submits a purchase transaction enclosing the seller's signature and the payment. Payment distribution and NFT ownership transfer are handled atomically inside one transaction." },
            { title: "Off-chain reflection", body: "The indexing hub periodically scrapes and stores recent block events; the market server, on its own cycle, pulls unprocessed transactions, checks the hash hasn't been handled, and updates business tables per event type." },
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
            { icon: ShieldCheck, title: "The server never holds a wallet's private key", body: "Final ownership is always settled by an on-chain transaction. The server only issues the credential (signature) to create that transaction, or reads completed transactions into its DB after the fact." },
            { icon: Stamp, title: "Mint approval is free; the player pays gas for the actual mint", body: "The server proves only 'this URI may be minted to this wallet' via EIP-712, and the player wallet fires the actual transaction. The server never has to fund every user's minting gas." },
            { icon: ShoppingCart, title: "Listings are off-chain; payment and ownership transfer are atomic in one transaction", body: "A seller just signs the terms and can list/delist freely at no cost. The actual funds and ownership move in a single transaction at purchase time, so payment-without-NFT is structurally impossible." },
            { icon: Repeat2, title: "A polling indexer feeds on-chain history back into the DB after the fact", body: "The indexing hub and market server decode the same raw transaction logs for different ends — the indexer builds general activity history, the market server builds business states like on-sale/sold." },
            { icon: HandCoins, title: "Idempotency is guaranteed separately at each layer", body: "The indexing hub uses the last processed block number, the market server a per-hash processed flag, and notifications a short-TTL cache — blocking duplicate reflection and duplicate sends." },
          ],
        },
      ],
    },
    { label: "DIAGRAM — MINT", title: "1. Mint", blocks: [{ kind: "mermaid", chart: enMint }] },
    { label: "DIAGRAM — MARKET", title: "2. Purchase (market)", blocks: [{ kind: "mermaid", chart: enPurchase }] },
    { label: "DIAGRAM — SYNC", title: "3. Off-chain reflection", blocks: [{ kind: "mermaid", chart: enSync }] },
    {
      label: "PROS",
      title: "Why this design is good",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "The server holds no private keys, so even a compromised server can't directly steal user assets.",
            "Splitting mint approval from the actual mint transaction means the server doesn't fund every user's gas.",
            "Purchases bind payment and ownership transfer into one transaction, so paying without receiving the item is impossible by contract design.",
            "Listings are off-chain and free, so sellers can list and delist freely without worrying about gas.",
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
            "The indexer and market server each decode the same transaction logs separately — a duplicated maintenance cost where every event-handling change must be tagged for the right consumer.",
            "Off-chain reflection is polling-based, so there's a lag between on-chain finality and the market DB update.",
            "Sale notifications are published best-effort, so loss of a notification to the game side isn't fully ruled out.",
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
            "Unify the indexer's and market server's event decoding into a shared library to eliminate duplicate interpretation.",
            "Replace polling with event-driven delivery (webhooks/subscriptions) to shrink the finality-to-DB lag.",
            "Add retries and a dead-letter queue to the best-effort notifications to reduce loss.",
          ],
        },
      ],
    },
  ],
};

const content: NoteContent = { ko, en };
export default content;
