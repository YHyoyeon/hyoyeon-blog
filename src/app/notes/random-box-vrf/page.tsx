import type { Metadata } from "next";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Dices,
  ShieldX,
  Siren,
  EyeOff,
  Ban,
} from "lucide-react";
import { NoteHeader, NoteSection, KeyPointList, StepList, IconList } from "@/components/notes/NoteLayout";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import MermaidDiagram from "@/components/notes/MermaidDiagram";
import NoteNav from "@/components/notes/NoteNav";

export const metadata: Metadata = { title: "랜덤박스(가챠) 확률 시스템과 'VRF'의 실체" };

const sequenceSource = `sequenceDiagram
    autonumber
    participant User as 사용자 지갑
    participant RB as RandomBox 컨트랙트
    participant VRF as VRF 컨트랙트 (자체 구현)
    participant Worker as kingdomScan 마스터 지갑 워커

    User->>RB: OpenBox(tokenId, boxRarity, signature)
    RB-->>RB: 서명 검증 (kingdomScan 마스터 키)
    RB->>VRF: requestRandomWords(...)
    VRF-->>VRF: RequestStatus 저장 (fulfilled=false)

    loop 수 초 간격 폴링
        Worker->>VRF: 미이행 요청 조회 (requestIds)
        VRF-->>Worker: 다음 미이행 requestId
        Worker-->>Worker: RandomWord = Math.random() 기반 정수 생성
        Worker->>VRF: MsFulfillRandomWords(reqId, [RandomWord])
    end

    VRF-->>RB: OnVrfResult(requestId, randomWords)
    RB-->>RB: randomSeed % totalRatio (또는 % 히어로 목록 길이)로 등급 확정
    RB-->>User: 최종 결과 확정 (이벤트 emit)`;

const highlights = [
  {
    icon: ShieldX,
    title: "정식 fulfillRandomWords는 쓰이지 않는다",
    body: "컨트랙트에는 체인링크 스타일의 내부 전용 fulfillRandomWords가 있지만, 실제로 호출되는 건 마스터 지갑 전용의 별도 외부 함수다.",
  },
  {
    icon: Dices,
    title: "난수의 출처는 서버의 Math.random()이다",
    body: "온체인 오라클이나 암호학적 난수가 아니라, 인덱싱 허브 워커 프로세스가 생성한 값을 그대로 온체인에 제출한다.",
  },
  {
    icon: Siren,
    title: "테스트넷 제한 체크가 무력화되어 있다",
    body: "'테스트넷에서만 작동함'이라는 주석과 함께 체인ID 체크 코드가 남아있지만, 그 체크 자체가 주석 처리되어 실제로는 모든 네트워크(라이브 포함)에서 이 경로가 그대로 동작한다.",
  },
  {
    icon: EyeOff,
    title: "결과를 사전에 예측하거나 사후 검증할 방법이 없다",
    body: "이름과 인터페이스는 '검증 가능한 난수'를 표방하지만, 실제로는 운영사가 통제하는 단일 지갑이 언제·어떤 값으로 결과를 확정할지 결정하는 구조다.",
  },
  {
    icon: Ban,
    title: "박스 오픈 UI는 실제로 안 쓰이고 있을 수 있다",
    body: "확인 시점 기준으로 박스 오픈 관련 훅은 어떤 페이지에서도 import되지 않았고, 실제로 페이지에 연결된 건 합성(fusion) 쪽뿐이었다.",
  },
];

const implementationSteps = [
  {
    title: "비율 테이블 등록",
    body: "운영진이 배포 시점에 등급별 확률(예: 94%/6%)을 담은 비율 테이블을 컨트랙트에 등록한다.",
  },
  {
    title: "서명 발급 요청",
    body: "사용자가 박스를 열거나 합성을 시도하면 인덱싱 허브가 EIP-712 서명을 마스터 키로 발급한다.",
  },
  {
    title: "온체인 요청 제출",
    body: "사용자가 이 서명과 함께 박스 오픈·합성 함수를 호출한다. 컨트랙트는 서명을 서버 마스터 키로 복원해 검증한 뒤에만 실행을 허용한다.",
  },
  {
    title: "VRF 요청 전달",
    body: "검증을 통과하면 컨트랙트가 내부 VRF 컨트랙트에 난수를 요청하고, 미이행 상태로 대기한다.",
  },
  {
    title: "워커가 폴링 후 값 제출",
    body: "인덱싱 허브의 마스터 지갑 워커가 미이행 요청을 주기적으로 폴링하다가, Math.random()으로 정수를 하나 생성해 온체인에 제출한다. 이 함수는 마스터로 지정된 단일 계정만 호출 가능하다.",
  },
  {
    title: "결과 확정",
    body: "콜백이 실행되며 난수 % 총 비율(합성) 또는 난수 % 히어로 목록 길이(박스 오픈) 연산으로 최종 등급·결과가 확정되고 이벤트가 emit된다.",
  },
  {
    title: "프론트엔드 확률 공개",
    body: "마켓플레이스 프론트엔드가 비율 테이블에서 파생된 등급별 획득 확률을 사용자에게 테이블로 보여준다.",
  },
];

const pros = [
  "비율 테이블을 배포 시점에 등록하는 방식이라, 등급별 확률을 운영진이 유연하게 조정할 수 있다.",
  "요청 단계에서 서명 검증을 거치기 때문에, 임의의 지갑이 아무 조건 없이 박스를 열거나 합성을 시도할 수 없다.",
  "프론트엔드에 확률 공개 UI가 실제로 존재해, 최소한 표면적으로는 사용자에게 등급별 확률을 투명하게 보여준다.",
];

const cons = [
  "이름은 'VRF'지만 암호학적으로 검증 가능한 난수가 아니다 — 결과가 조작되지 않았음을 제3자가 증명할 방법이 없다.",
  "소각·발행·VRF 이행을 모두 처리하는 마스터 지갑이 단일 장애점이자 단일 조작 가능 지점이 된다.",
  "테스트넷 전용으로 의도된 체크가 주석 처리된 채 라이브에도 적용되고 있어, 코드 주석과 실제 동작이 어긋나 있다.",
  "확률을 대량 반복해 실제 분포를 검증하는 스크립트가 존재했던 것으로 보이나, 관련 레포들의 현재 코드와 git 히스토리를 뒤져도 위치를 특정하지 못했다.",
];

const improvements = [
  "체인링크 VRF 같은 실제 검증 가능한 난수 서비스, 또는 최소한 커밋-리빌 방식으로 교체하는 방안을 검토한다.",
  "테스트넷 전용 체크 주석의 의도를 재검토해, 실제로 필요 없다면 주석과 코드를 정리하고 필요하다면 다시 활성화한다.",
  "확률 검증 스크립트의 정확한 소재를 파악해 문서에 보강하고, 가능하다면 CI에 편입해 배포 시점마다 확률표와 실제 분포가 일치하는지 자동 검증한다.",
  "소각·발행·VRF 이행 권한을 하나의 마스터 지갑에 몰아주지 말고 기능별로 분리하는 방안을 검토한다.",
];

export default function RandomBoxVrf() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 md:px-8 py-16 md:py-24">
          <NoteHeader
            title="랜덤박스(가챠) 확률 시스템과 'VRF'의 실체"
            intro="박스·합성 결과의 등급을 결정하는 확률표와, 그 확률을 굴리는 'VRF'라는 이름의 난수 시스템이 실제로는 어떻게 동작하는지 정리했습니다."
          />

          <NoteSection label="PURPOSE — 목적" title="왜 'VRF'라는 이름이 붙었는가">
            <p className="text-sm text-muted-foreground leading-relaxed break-keep">
              가챠형 랜덤박스는 결과 조작 의혹을 피하려면 난수 생성 과정이 검증 가능해야 합니다. 이
              랜덤박스 컨트랙트도 체인링크 VRF와 같은 요청-이행(request/fulfill) 인터페이스를 그대로
              본떠 만들었습니다. 다만 실제로 누가, 어떤 방식으로 그 난수 값을 채워 넣는지를 따라가 보면
              이름이 암시하는 '검증 가능한 난수'와는 다른 동작을 한다는 걸 확인할 수 있습니다.
            </p>
          </NoteSection>

          <NoteSection label="HOW — 구현 방법" title="박스 오픈/합성 요청부터 결과 확정까지">
            <StepList steps={implementationSteps} />
          </NoteSection>

          <NoteSection label="KEY POINTS — 중요한 것" title="핵심 설계 포인트">
            <KeyPointList items={highlights} />
          </NoteSection>

          <NoteSection label="DIAGRAM — 시퀀스" title="박스 오픈 → VRF 요청/이행 시퀀스">
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

          <NoteNav slug="random-box-vrf" />
        </div>
      </main>
      <Footer />
    </>
  );
}
