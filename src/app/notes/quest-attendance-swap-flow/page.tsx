import type { Metadata } from "next";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Ban,
  CalendarCheck,
  ArrowLeftRight,
  ListChecks,
  Trash2,
} from "lucide-react";
import { NoteHeader, NoteSection, KeyPointList, StepList, IconList } from "@/components/notes/NoteLayout";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import NoteNav from "@/components/notes/NoteNav";
import MermaidDiagram from "@/components/notes/MermaidDiagram";

export const metadata: Metadata = { title: "출석체크·미션·스왑 — 온체인 트랜잭션 연동 구조" };

const sequenceSource = `sequenceDiagram
    autonumber
    participant User as 사용자 (지갑/Openfort)
    participant Backend as 백엔드
    participant Scan as kingdomScan
    participant Chain as KingdomStoryReward 컨트랙트
    participant Worker as 백엔드 이벤트 잡

    User->>Backend: POST /v2/transactions/:txnType (제거됨)
    Backend->>Scan: 서명 요청 (get-quest-hash)
    Scan-->>Scan: EIP-712 서명 (마스터 키)
    Scan-->>Backend: {signature, internalQuestHash}
    Backend-->>User: 서명 반환

    User->>Chain: Quest*(..., signature) 직접 호출
    Chain-->>Chain: 서명 검증(ECDSA.recover) 또는 무서명 타임스탬프 기록
    Chain-->>Chain: 이벤트 emit (토큰 전송은 없음)

    Scan->>Chain: 이벤트 감지
    Backend->>Scan: 이벤트/미처리 트랜잭션 조회
    Backend-->>Worker: DB 잡 큐잉 (제거됨)
    Worker-->>Worker: DB 잔액/카운터 갱신, 인게임 우편 발송`;

const highlights = [
  {
    icon: Ban,
    title: "온체인 함수들은 토큰을 전송하지 않는다",
    body: "서명 검증 후 이벤트만 emit하고, 실제 보상 지급은 전부 오프체인 DB에서 일어난다.",
  },
  {
    icon: ArrowLeftRight,
    title: "스왑은 DEX가 아니라 고정 비율 내부 재화 교환이었다",
    body: "시장가·유동성과 무관하게, 운영 설정값(최소/최대 한도, 스왑 비율) 기준으로 정산됐다.",
  },
  {
    icon: CalendarCheck,
    title: "출석체크만 서명 없이 타임스탬프만 남기는 경로를 썼다",
    body: "그날 출석했다는 사실 자체를 온체인에 남기는 용도에 가까웠고, 다른 기능과 달리 서명 검증이 없었다.",
  },
  {
    icon: ListChecks,
    title: "미션 보상은 거의 전부 DB 카운터 기반이었다",
    body: "온체인 증빙이 필요한 건 발행·소각·NFT 구매·초대·스왑·일일 출석처럼 체인에서 검증 가능한 행동뿐이었다.",
  },
  {
    icon: Trash2,
    title: "기능 자체가 완전히 제거된 상태다",
    body: "삭제 이전에도 관련 라우트가 비활성화 미들웨어로 막혀 있던 흔적이 있어, 실질적 서비스 중단은 최종 삭제보다 앞섰을 가능성이 있다.",
  },
];

const implementationSteps = [
  {
    title: "서명 요청",
    body: "사용자가 백엔드에 트랜잭션 유형(일일 보상/스왑/복권/초대)을 지정해 요청한다.",
  },
  {
    title: "서명 발급",
    body: "백엔드가 인덱싱 허브에 서명을 요청하면, 기능별로 다른 EIP-712 타입 데이터를 마스터 키로 서명해 반환한다.",
  },
  {
    title: "온체인 제출",
    body: "사용자가 지갑(또는 임베디드 스마트 계정)으로 해당 함수를 직접 호출한다. 컨트랙트는 서명을 검증하고 재사용 방지 매핑을 확인한 뒤 이벤트만 emit한다 — 토큰 전송은 일어나지 않는다.",
  },
  {
    title: "이벤트 감지 및 잡 큐잉",
    body: "인덱싱 허브가 이벤트를 감지하면 백엔드가 이를 잡 큐에 넣는다.",
  },
  {
    title: "오프체인 정산",
    body: "잡이 실행되며 DB 잔액·카운터를 갱신하고, 필요하면 인게임 우편을 발송한다.",
  },
];

const pros = [
  "온체인은 증빙만, 오프체인은 정산만 담당하게 나눠서 잦은 보상 지급 로직을 매번 가스비 들여 온체인에 반영할 필요가 없었다.",
  "마켓플레이스 구매·브릿지에 쓰던 서명 발급 인프라를 그대로 재사용해, 새 기능을 추가하는 비용이 낮았다.",
];

const cons = [
  "컨트랙트는 여전히 배포되어 있는데 호출 경로가 전부 사라져, 코드베이스에 죽은 참조(고아 모달 컴포넌트, 미사용 훅 파일)가 남아있다.",
  "삭제가 커밋 두 개로 나뉘어 이루어져 있어, 정말 완전히 제거됐는지 추적하려면 히스토리를 여러 번 확인해야 한다.",
  "스왑 관련 시세 오라클이 실제로는 아무 데서도 호출되지 않는데 코드만 살아있어, 나중에 보는 사람이 현재도 쓰이는 기능으로 오해하기 쉽다.",
];

const improvements = [
  "고아 상태로 남은 컴포넌트·훅 파일을 완전히 제거하거나, 재사용 가능성이 있다면 그 의도를 명확히 문서화한다.",
  "시세 오라클의 실사용 여부를 다시 확인해 정말 아무도 안 쓴다면 제거를 검토한다.",
  "유사한 출석·미션·스왑성 기능을 다시 도입할 일이 생기면, 이번에 정리한 서명 발급 인프라 재사용 구조를 그대로 참고할 수 있도록 남겨둔다.",
];

export default function QuestAttendanceSwapFlow() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 md:px-8 py-16 md:py-24">
      <NoteHeader
        title="출석체크·미션·스왑 — 온체인 트랜잭션 연동 구조"
        intro="지금은 서비스되지 않지만, 마켓플레이스 전반과 동일한 '서명 발급 → 사용자 제출 → 오프체인 정산' 패턴을 재사용했던 출석체크·미션·스왑 기능의 마지막 구현을 git 히스토리에서 복원해 정리했습니다."
      />

      <NoteSection label="PURPOSE — 목적" title="왜 이미 없는 기능을 문서화하는가">
        <p className="text-sm text-muted-foreground leading-relaxed break-keep">
          사쿠루 네트워크 관련 기능 삭제 작업 때 출석체크·미션·스왑·초대·래플 관련 라우트·화면·잡이
          통째로 삭제되었습니다. 온체인 컨트랙트 자체는 여전히 배포되어 있지만, 현재 백엔드·프론트엔드
          어디에서도 이를 호출하는 코드가 없습니다. 다만 이 기능들이 썼던 연동 패턴 — 인덱싱 허브가
          서명을 발급하고, 사용자 지갑이 그 서명으로 온체인 트랜잭션을 쏘고, 이벤트를 감지해 오프체인에서
          정산하는 구조 — 은 마켓플레이스 구매·브릿지·랜덤박스와 동일한 인프라를 재사용한 사례라
          아키텍처 관점에서 기록해 둘 가치가 있습니다.
        </p>
      </NoteSection>

      <NoteSection label="HOW — 구현 방법" title="공통 연동 패턴 (제거됨)">
        <StepList steps={implementationSteps} />
        <p className="mt-6 text-sm text-muted-foreground leading-relaxed break-keep">
          일일 출석은 위 공통 패턴 대신 서명 검증 없이 호출자와 타임스탬프만 emit하는 무서명 함수를
          썼습니다. 스왑은 시장가나 유동성 풀과 무관하게, 백엔드 잡이 운영 설정값(최소·최대 한도, 스왑
          비율)으로 검증한 뒤 고정 환율로 재화를 교환하는 내부 환전이었고, 온체인 트랜잭션은 "이 교환
          요청이 유효하다"는 서명된 증빙 역할만 했습니다.
        </p>
      </NoteSection>

      <NoteSection label="KEY POINTS — 중요한 것" title="핵심 설계 포인트">
        <KeyPointList items={highlights} />
      </NoteSection>

      <NoteSection label="DIAGRAM — 시퀀스" title="공통 연동 시퀀스 (제거됨, 히스토리 기준)">
        <MermaidDiagram chart={sequenceSource} />
      </NoteSection>

      <NoteSection label="PROS — 장점" title="이 구조가 (설계 당시) 좋았던 이유">
        <IconList items={pros} icon={CheckCircle2} tone="accent" />
      </NoteSection>

      <NoteSection label="CONS — 단점 · 트레이드오프" title="남아있는 잔재">
        <IconList items={cons} icon={AlertTriangle} tone="destructive" />
      </NoteSection>

      <NoteSection label="NEXT — 개선점" title="앞으로 정리하고 싶은 부분">
        <IconList items={improvements} icon={Lightbulb} tone="muted" />
      </NoteSection>
          <NoteNav slug="quest-attendance-swap-flow" />
        </div>
      </main>
      <Footer />
    </>
  );
}
