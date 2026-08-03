import type { Metadata } from "next";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Stamp,
  ShoppingCart,
  Repeat2,
  HandCoins,
  ShieldCheck,
} from "lucide-react";
import { NoteHeader, NoteSection, KeyPointList, StepList, IconList } from "@/components/notes/NoteLayout";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import NoteNav from "@/components/notes/NoteNav";
import MermaidDiagram from "@/components/notes/MermaidDiagram";

export const metadata: Metadata = { title: "NFT 발행 → 구매: 온체인/오프체인 동기화" };

const mintFlow = `sequenceDiagram
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

const purchaseFlow = `sequenceDiagram
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

const syncFlow = `sequenceDiagram
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

const highlights = [
  {
    icon: ShieldCheck,
    title: "서버는 지갑의 개인키를 대신 쥐고 있지 않다",
    body: "최종 소유권은 항상 온체인 트랜잭션으로 확정된다. 서버는 그 트랜잭션을 만들 자격(서명)을 발급하거나, 이미 일어난 트랜잭션을 뒤늦게 읽어와 DB에 반영하는 역할만 한다.",
  },
  {
    icon: Stamp,
    title: "발행 승인은 무료, 실제 발행은 플레이어가 가스비를 낸다",
    body: "서버가 EIP-712 서명으로 '이 URI를 이 지갑에 발행해도 된다'만 증명하고, 실제 트랜잭션은 플레이어 지갑이 직접 쏜다. 서버가 모든 유저의 민팅 가스비를 부담할 필요가 없다.",
  },
  {
    icon: ShoppingCart,
    title: "판매 리스팅은 오프체인, 결제·소유권 이전은 한 트랜잭션에서 원자적으로",
    body: "판매자는 조건에 서명만 하고 무료로 몇 번이든 올렸다 내렸다 할 수 있다. 실제 자금·소유권 이동은 구매 시점 단 한 번의 트랜잭션으로 원자적으로 처리돼, 결제만 되고 NFT는 안 넘어가는 상황이 구조적으로 불가능하다.",
  },
  {
    icon: Repeat2,
    title: "온체인에서 있었던 일을 폴링 인덱서가 뒤늦게 DB에 되먹인다",
    body: "인덱싱 허브와 마켓 서버가 같은 원본 트랜잭션 로그를 각자 다른 목적으로 디코딩한다 — 인덱서는 범용 활동 이력을, 마켓 서버는 판매중·판매완료 같은 비즈니스 상태를 만든다.",
  },
  {
    icon: HandCoins,
    title: "멱등성을 여러 층에서 각각 보장한다",
    body: "인덱싱 허브는 마지막 처리 블록 번호로, 마켓 서버는 트랜잭션 해시 단위 처리 완료 플래그로, 알림은 짧은 TTL 캐시로 중복 반영·중복 발송을 막는다.",
  },
];

const implementationSteps = [
  {
    title: "발행(Mint) — 서명 발급",
    body: "게임 서버가 메타데이터와 대상 지갑을 서명/인덱싱 허브에 전달하면, 허브가 IPFS에 메타데이터를 올리고 운영자 개인키로 EIP-712 서명을 만든다.",
  },
  {
    title: "발행 트랜잭션",
    body: "플레이어 지갑이 URI와 서명으로 발행 트랜잭션을 직접 제출한다. 컨트랙트는 서명자가 등록된 운영자인지, 같은 일련번호가 재사용되지 않았는지 확인한 뒤 토큰을 발행한다.",
  },
  {
    title: "구매(Market) — 리스팅",
    body: "판매자가 가격·통화·유효기한에 EIP-712 서명만 하고, 마켓 API 서버는 서명을 검증해 DB에 저장한다. 아직 온체인 트랜잭션은 아니다.",
  },
  {
    title: "구매 트랜잭션",
    body: "구매자가 판매자 서명과 결제 금액을 동봉해 구매 트랜잭션을 제출한다. 결제 분배와 NFT 소유권 이전이 한 트랜잭션 안에서 원자적으로 처리된다.",
  },
  {
    title: "오프체인 반영",
    body: "인덱싱 허브가 주기적으로 최근 블록의 이벤트를 긁어 저장하면, 마켓 서버가 별도 주기로 미처리 트랜잭션을 가져와 이미 처리된 해시인지 확인한 뒤 이벤트 종류별로 비즈니스 테이블을 갱신한다.",
  },
];

const pros = [
  "서버가 개인키를 들고 있지 않아, 서버가 뚫려도 유저 자산을 직접 탈취할 수 없다.",
  "발행 승인과 실제 발행 트랜잭션을 분리해, 서버가 모든 유저의 가스비를 대신 부담하지 않는다.",
  "구매는 결제와 소유권 이전이 한 트랜잭션에 묶여 있어, 돈만 나가고 아이템은 못 받는 상황이 컨트랙트 구조상 불가능하다.",
  "리스팅이 오프체인·무료라서 판매자가 가스비 걱정 없이 자유롭게 올렸다 내렸다 할 수 있다.",
];

const cons = [
  "같은 트랜잭션 로그를 인덱서와 마켓 서버가 각자 따로 디코딩한다 — 이벤트 처리 로직을 고칠 때 어느 쪽을 위한 변경인지 항상 구분해야 하는 중복 유지보수 비용이 있다.",
  "오프체인 반영이 폴링 기반이라, 체인에서 트랜잭션이 확정된 시점과 마켓 서버 DB에 반영되는 시점 사이에 지연이 생긴다.",
  "판매 체결 알림은 best-effort로 발행돼, 게임 쪽에 알림이 유실될 가능성을 완전히 배제하지 않는다.",
];

const improvements = [
  "인덱서와 마켓 서버의 이벤트 디코딩 로직을 공유 라이브러리로 통합해 중복 해석을 없앤다.",
  "폴링 주기를 이벤트 기반(웹훅·구독)으로 바꿔 온체인 확정과 DB 반영 사이의 지연을 줄인다.",
  "best-effort 알림에 재시도·데드레터 큐를 추가해 유실 가능성을 낮춘다.",
];

export default function NftMintPurchaseSync() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 md:px-8 py-16 md:py-24">
      <NoteHeader
        title="NFT 발행 → 구매: 온체인/오프체인 동기화"
        intro="게임 서버가 마음대로 발행하고 DB에 기록하는 구조가 아니라, 소유권이 항상 온체인 트랜잭션으로 확정되도록 만든 발행·구매·동기화 흐름을 정리했습니다."
      />

      <NoteSection label="PURPOSE — 목적" title="왜 이렇게 나눴나">
        <p className="text-sm text-muted-foreground leading-relaxed break-keep">
          Web2 서버가 지갑의 개인키를 대신 쥐고 있지 않다는 게 핵심 전제입니다. 오프체인 서버들은
          트랜잭션을 만들기 위한 자격(서명)을 발급하거나, 이미 일어난 트랜잭션을 뒤늦게 읽어와 자기
          DB에 반영하는 역할만 하도록 설계했습니다.
        </p>
      </NoteSection>

      <NoteSection label="HOW — 구현 방법" title="발행부터 오프체인 반영까지">
        <StepList steps={implementationSteps} />
      </NoteSection>

      <NoteSection label="KEY POINTS — 중요한 것" title="핵심 포인트">
        <KeyPointList items={highlights} />
      </NoteSection>

      <NoteSection label="DIAGRAM — 시퀀스" title="시퀀스 다이어그램">
        <div className="space-y-10">
          <div>
            <h3 className="text-sm font-semibold mb-3">1. 발행(Mint)</h3>
            <MermaidDiagram chart={mintFlow} />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3">2. 구매(Market)</h3>
            <MermaidDiagram chart={purchaseFlow} />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3">3. 오프체인 반영</h3>
            <MermaidDiagram chart={syncFlow} />
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
          <NoteNav slug="nft-mint-and-purchase-sync" />
        </div>
      </main>
      <Footer />
    </>
  );
}
