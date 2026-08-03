import type { Metadata } from "next";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Calculator,
  Landmark,
  ShieldCheck,
  Layers,
  Siren,
} from "lucide-react";
import { NoteHeader, NoteSection, KeyPointList, StepList, IconList } from "@/components/notes/NoteLayout";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import NoteNav from "@/components/notes/NoteNav";
import MermaidDiagram from "@/components/notes/MermaidDiagram";

export const metadata: Metadata = { title: "크로스체인 브릿지 — 소각·발행 기반 자산 이동" };

const sequenceSource = `sequenceDiagram
    autonumber
    participant User as 사용자 지갑
    participant Backend as 백엔드 API
    participant Scan as kingdomScan
    participant Src as 출발 체인 (Market 컨트랙트)
    participant Worker as kingdomScan 브릿지 워커
    participant Dst as 도착 체인 (Market 컨트랙트)

    User->>Backend: 브릿지 요청 (토큰/NFT, 목적 체인)
    Backend-->>Backend: 소유권 검증, 중복요청 락, market_transaction(pending) 생성
    Backend->>Scan: 브릿지 소각 서명 요청
    Scan-->>Scan: 수수료 산정 + EIP-712 서명(마스터 키)
    Scan-->>Backend: {fee, deadline, signature}
    Backend-->>User: 서명/수수료 반환

    User->>Src: BridgeBurn(..., fee, deadline, signature) + fee만큼 native 결제
    Src-->>Src: 서명 검증, 수수료 정산, 토큰 소각
    Src-->>Src: BridgeBurned 이벤트 emit

    Scan->>Src: 이벤트 폴링으로 BridgeBurned 감지
    Scan-->>Scan: BridgeLog(status=new) 기록
    Backend->>Src: (별도 리스너) BridgeBurned 감지 → market_transaction 완료 처리

    loop 수 초 간격
        Worker->>Scan: status=new 인 BridgeLog 조회 (도착 체인 기준)
    end
    Worker->>Dst: BridgeMint(bridgeId, fromChain, ...) — 마스터 지갑으로 직접 호출
    Dst-->>Dst: 중복 발행 방지 체크 후 토큰 발행, BridgeMinted emit
    Scan->>Dst: BridgeMinted 감지 → BridgeLog에 새 토큰ID 기록
    Backend->>Dst: (별도 리스너) BridgeMinted 감지 → market_transaction 완료 처리`;

const highlights = [
  {
    icon: Calculator,
    title: "수수료는 온체인 고정표가 아니라 오프체인 동적 계산이다",
    body: "최근 발행 트랜잭션의 가스비, 체인 간 네이티브 토큰 시세 비율, 자산별 최소 기본 수수료를 조합해 매 요청마다 계산하고, 그 값을 서명 다이제스트에 실어 온체인으로 전달한다.",
  },
  {
    icon: Landmark,
    title: "정산은 서명 속 주소가 아니라 컨트랙트에 등록된 주소로",
    body: "컨트랙트는 서명에 담긴 수취 주소를 그대로 믿지 않고, 자체 설정된 플랫폼 수수료 주소로만 정산한다.",
  },
  {
    icon: ShieldCheck,
    title: "서명 재사용 방지 + 1시간 유효기간",
    body: "트레이드·오퍼 서명과 동일한 재사용 방지 매핑을 쓰고, 브릿지 서명에도 1시간짜리 마감시각이 붙어 오래된 서명은 온체인에서 거절된다.",
  },
  {
    icon: Layers,
    title: "중복 발행 방지가 3중이다",
    body: "온체인 매핑, 인덱서 쪽 브릿지 로그의 복합키 유일성, 백엔드의 기존 기록 확인까지 세 겹으로 같은 소각 건이 두 번 발행되지 않도록 막는다.",
  },
  {
    icon: Siren,
    title: "체인 혼용 검증은 온체인이 아니라 백엔드 책임이다",
    body: "컨트랙트 자체는 출발·도착 체인이 실제로 다른지, 메인넷·테스트넷이 섞이지 않는지 검증하지 않는다. 이 검증 로직이 과거 한 번 통째로 삭제된 이력도 있다.",
  },
];

const implementationSteps = [
  {
    title: "브릿지 요청",
    body: "사용자가 백엔드에 브릿지를 요청하면, 백엔드가 소유권을 검증하고 요청 단위 락을 건 뒤 트랜잭션 레코드를 대기 상태로 만든다.",
  },
  {
    title: "수수료 산정 + 서명 발급",
    body: "인덱싱 허브가 수수료를 계산하고, 목적 체인·대상 컨트랙트·토큰ID·수수료·마감시각을 담은 EIP-712 다이제스트를 마스터 키로 서명해 반환한다.",
  },
  {
    title: "온체인 소각 호출",
    body: "사용자가 이 서명과 수수료(native token)를 들고 출발 체인의 소각 함수를 직접 호출한다. 컨트랙트가 서명을 검증하고 수수료를 정산한 뒤 토큰을 소각한다.",
  },
  {
    title: "이벤트 이중 감지",
    body: "소각 이벤트를 인덱싱 허브와 백엔드가 각각 독립적으로 감지해, 허브는 자기 DB에 브릿지 로그를 남기고 백엔드는 자기 트랜잭션 상태를 완료로 갱신한다.",
  },
  {
    title: "발행 워커 폴링",
    body: "인덱싱 허브의 브릿지 워커가 도착 체인 기준으로 미처리 브릿지 로그를 하나씩(동시에 하나만) 꺼낸다.",
  },
  {
    title: "온체인 발행 호출",
    body: "워커가 도착 체인의 발행 함수를 마스터 지갑으로 직접 호출한다. 컨트랙트는 중복 발행 여부를 확인한 뒤 토큰을 발행하고 이벤트를 emit한다.",
  },
  {
    title: "발행 완료 반영",
    body: "인덱싱 허브와 백엔드가 각각 발행 완료 이벤트를 감지해 자기 쪽 상태를 완료로 갱신한다.",
  },
];

const pros = [
  "온체인은 서명 검증과 소각·발행만 담당하고, 수수료 계산처럼 자주 바뀌는 로직은 오프체인에 둬서 유연하게 조정할 수 있다.",
  "3중 중복 발행 방지 덕분에 같은 소각 건이 두 번 발행되는 사고는 구조적으로 막혀 있다.",
  "컨펌 대기 + 타임아웃으로 발행 트랜잭션이 애매하게 걸린 상태를 실패로 판정해 다음 처리로 넘어갈 수 있다.",
];

const cons = [
  "소각 서명 발급, 발행 트랜잭션 실행, 랜덤박스 VRF 이행까지 전부 같은 마스터 지갑 하나가 처리한다 — 단일 장애점이자 단일 공격 표면이다.",
  "발행 워커가 체인별로 한 번에 한 건씩만 순차 처리해서, 트랜잭션 하나가 느려지면 그 체인의 나머지 브릿지 요청 전체가 밀린다.",
  "체인 혼용 검증이 온체인에 없어서, 백엔드 검증을 우회하면(또는 검증 로직에 결함이 생기면) 막을 방법이 없다.",
  "브릿지 관련 이벤트 핸들러가 리그레션 후 복구된 이력이 있을 만큼, 상대적으로 손이 많이 가는 영역이다.",
];

const improvements = [
  "체인ID 검증을 백엔드뿐 아니라 컨트랙트 레벨에도 추가해 이중으로 보호한다.",
  "마스터 키의 권한을 소각 서명·발행 실행·VRF 이행 등 기능별로 분리하고, 가능하면 멀티시그를 도입한다.",
  "발행 워커를 체인별 큐로 확장하거나 병렬화해 순차 처리 병목을 줄인다.",
  "인덱싱 허브와 백엔드로 나뉜 브릿지 상태 저장소를 하나로 통합하거나, 최소한 두 저장소 간 정합성을 주기적으로 검증한다.",
];

export default function CrossChainBridge() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 md:px-8 py-16 md:py-24">
      <NoteHeader
        title="크로스체인 브릿지 — 소각·발행 기반 자산 이동"
        intro="같은 자산(히어로 NFT, 아이템 NFT, 토큰)을 서로 다른 체인에서 각각 발행해 운영하다 보니 필요해진 소각-발행 기반 브릿지 구조를 정리했습니다."
      />

      <NoteSection label="PURPOSE — 목적" title="왜 브릿지가 필요한가">
        <p className="text-sm text-muted-foreground leading-relaxed break-keep">
          같은 자산을 여러 체인에서 각각 발행해 운영하다 보니, 사용자가 한 체인에서 다른 체인으로
          자산을 옮기고 싶을 때 쓰는 브릿지가 필요해졌습니다. 각 토큰 컨트랙트가 브릿지 인터페이스를
          구현하고, 실제 오케스트레이션(수수료 계산, 서명 검증, 소각/발행 지시)은 마켓 컨트랙트가
          허브 역할을 맡는 구조로 설계했습니다.
        </p>
      </NoteSection>

      <NoteSection label="HOW — 구현 방법" title="소각(burn) → 오프체인 중계 → 발행(mint)">
        <StepList steps={implementationSteps} />
      </NoteSection>

      <NoteSection label="KEY POINTS — 중요한 것" title="핵심 설계 포인트">
        <KeyPointList items={highlights} />
      </NoteSection>

      <NoteSection label="DIAGRAM — 시퀀스" title="브릿지 소각/발행 시퀀스">
        <MermaidDiagram chart={sequenceSource} />
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
          <NoteNav slug="cross-chain-bridge" />
        </div>
      </main>
      <Footer />
    </>
  );
}
