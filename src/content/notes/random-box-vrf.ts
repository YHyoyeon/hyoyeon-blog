import { CheckCircle2, AlertTriangle, Lightbulb, Dices, ShieldX, EyeOff } from "lucide-react";
import type { NoteBody, NoteContent } from "@/lib/note-content";

const koChart = `sequenceDiagram
    autonumber
    participant User as 사용자 지갑
    participant RB as RandomBox 컨트랙트
    participant VRF as VRF 컨트랙트 (자체 구현)
    participant Worker as 운영자 워커

    User->>RB: OpenBox(tokenId, boxRarity, signature)
    RB-->>RB: 서명 검증 (운영자 마스터 키)
    RB->>VRF: requestRandomWords(...)
    VRF-->>VRF: RequestStatus 저장 (fulfilled=false)

    loop 수 초 간격 폴링
        Worker->>VRF: 미이행 요청 조회 (requestIds)
        VRF-->>Worker: 다음 미이행 requestId
        Worker-->>Worker: 오프체인에서 난수 생성
        Worker->>VRF: fulfillRandomWords(reqId, [randomWord])
    end

    VRF-->>RB: OnVrfResult(requestId, randomWords)
    RB-->>RB: randomSeed % totalRatio (또는 % 목록 길이)로 등급 확정
    RB-->>User: 최종 결과 확정 (이벤트 emit)`;

const enChart = `sequenceDiagram
    autonumber
    participant User as User wallet
    participant RB as RandomBox contract
    participant VRF as VRF contract (home-built)
    participant Worker as Operator worker

    User->>RB: OpenBox(tokenId, boxRarity, signature)
    RB-->>RB: verify signature (operator master key)
    RB->>VRF: requestRandomWords(...)
    VRF-->>VRF: store RequestStatus (fulfilled=false)

    loop polling every few seconds
        Worker->>VRF: query unfulfilled requests (requestIds)
        VRF-->>Worker: next unfulfilled requestId
        Worker-->>Worker: generate randomness off-chain
        Worker->>VRF: fulfillRandomWords(reqId, [randomWord])
    end

    VRF-->>RB: OnVrfResult(requestId, randomWords)
    RB-->>RB: rarity fixed via randomSeed % totalRatio (or % list length)
    RB-->>User: final result settled (event emitted)`;

const ko: NoteBody = {
  intro: "온체인 가챠(랜덤박스·합성)에서 'VRF'라는 이름을 단 난수 시스템을 다룬 경험을 정리했다. 인터페이스는 검증 가능한 난수(VRF)를 본떴지만 실제 난수는 오프체인 워커가 채우는 패턴으로, 이런 '의사(pseudo)-VRF' 구조의 동작과 한계, 개선 방향을 다룹니다.",
  sections: [
    {
      label: "PURPOSE — 목적",
      title: "왜 'VRF'라는 이름이 붙는가",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "가챠형 랜덤박스는 결과 조작 의혹을 피하려면 난수 생성 과정이 검증 가능해야 합니다. 그래서 많은 온체인 가챠 컨트랙트가 체인링크 VRF와 같은 요청-이행(request/fulfill) 인터페이스를 본떠 만듭니다. 다만 실제로 누가, 어떤 방식으로 그 난수 값을 채워 넣는지에 따라 이름이 암시하는 '검증 가능한 난수'와는 전혀 다른 보증 수준이 될 수 있다. 이 글은 그 차이를 아키텍처 관점에서 짚는다.",
          ],
        },
      ],
    },
    {
      label: "HOW — 구현 방법",
      title: "박스 오픈/합성 요청부터 결과 확정까지",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "비율 테이블 등록", body: "배포 시점에 등급별 확률(예: 94%/6%)을 담은 비율 테이블을 컨트랙트에 등록한다." },
            { title: "서명 발급 요청", body: "사용자가 박스를 열거나 합성을 시도하면 서버가 EIP-712 서명을 발급한다." },
            { title: "온체인 요청 제출", body: "사용자가 이 서명과 함께 박스 오픈·합성 함수를 호출한다. 컨트랙트는 서명을 서버 키로 복원해 검증한 뒤에만 실행을 허용한다." },
            { title: "VRF 요청 전달", body: "검증을 통과하면 컨트랙트가 내부 VRF 컨트랙트에 난수를 요청하고, 미이행 상태로 대기한다." },
            { title: "워커가 폴링 후 값 제출", body: "운영자 워커가 미이행 요청을 주기적으로 폴링하다가, 오프체인에서 생성한 정수를 온체인에 제출한다. 이 이행 함수는 지정된 운영자 계정만 호출할 수 있다." },
            { title: "결과 확정", body: "콜백이 실행되며 난수 % 총 비율(합성) 또는 난수 % 목록 길이(박스 오픈) 연산으로 최종 등급·결과가 확정되고 이벤트가 emit된다." },
            { title: "프론트엔드 확률 공개", body: "프론트엔드가 비율 테이블에서 파생된 등급별 획득 확률을 사용자에게 테이블로 보여준다." },
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
            { icon: Dices, title: "난수의 출처가 '검증 가능성'을 결정한다", body: "온체인 오라클이나 암호학적 난수가 아니라 서버 워커가 생성한 값을 온체인에 제출하면, 인터페이스가 VRF와 같아도 보증 수준은 전혀 다르다." },
            { icon: ShieldX, title: "이행 권한이 단일 운영자 계정에 집중된다", body: "난수 이행을 지정된 단일 계정만 호출할 수 있는 구조는 구현은 단순하지만, 그 계정이 단일 신뢰 지점이 된다." },
            { icon: EyeOff, title: "사전 예측·사후 검증 가능성이 핵심 평가 축", body: "이름과 인터페이스가 '검증 가능한 난수'를 표방하더라도, 결과가 조작되지 않았음을 제3자가 증명할 수 있어야 비로소 VRF라는 이름에 값한다." },
          ],
        },
      ],
    },
    { label: "DIAGRAM — 시퀀스", title: "박스 오픈 → VRF 요청/이행 시퀀스", blocks: [{ kind: "mermaid", chart: koChart }] },
    {
      label: "PROS — 장점",
      title: "이 패턴이 가진 장점",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "비율 테이블을 배포 시점에 등록하는 방식이라, 등급별 확률을 운영진이 유연하게 조정할 수 있다.",
            "요청 단계에서 서명 검증을 거치기 때문에, 임의의 지갑이 아무 조건 없이 박스를 열거나 합성을 시도할 수 없다.",
            "프론트엔드에 확률 공개 UI가 있어, 사용자에게 등급별 확률을 표면적으로 투명하게 보여줄 수 있다.",
          ],
        },
      ],
    },
    {
      label: "CONS — 단점 · 트레이드오프",
      title: "이 패턴의 한계",
      blocks: [
        {
          kind: "list",
          icon: AlertTriangle,
          tone: "destructive",
          items: [
            "이름은 'VRF'지만 암호학적으로 검증 가능한 난수가 아니다 — 결과가 조작되지 않았음을 제3자가 증명할 방법이 없다.",
            "이행 권한이 단일 계정에 집중되면 그 계정이 단일 장애점이자 단일 신뢰 지점이 된다.",
            "확률표와 실제 분포가 일치하는지 자동으로 검증하는 장치가 없으면, 공개된 확률의 신뢰를 코드가 아니라 운영 신뢰에만 기대게 된다.",
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
            "체인링크 VRF 같은 실제 검증 가능한 난수 서비스, 또는 최소한 커밋-리빌(commit-reveal) 방식으로 교체해 제3자 검증 가능성을 확보한다.",
            "확률표와 실제 분포가 일치하는지 배포 시점마다 자동 검증하는 테스트를 CI에 편입한다.",
            "난수 이행 권한을 소각·발행 등 다른 운영 권한과 분리하고, 가능하면 멀티시그를 도입한다.",
          ],
        },
      ],
    },
  ],
};

const en: NoteBody = {
  intro: "A write-up on working with a randomness system named 'VRF' in on-chain gacha (loot boxes / fusion). The interface mimics verifiable randomness (VRF), but the actual randomness is filled in by an off-chain worker — a 'pseudo-VRF' pattern. Here's how it works, its limits, and where to improve it.",
  sections: [
    {
      label: "PURPOSE",
      title: "Why it gets called 'VRF'",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "A gacha loot box needs a verifiable randomness pipeline to avoid rigging suspicions, so many on-chain gacha contracts are modeled on Chainlink VRF's request/fulfill interface. But depending on who actually fills in the random value, and how, the guarantee can be completely different from the 'verifiable randomness' the name implies. This note looks at that gap from an architecture standpoint.",
          ],
        },
      ],
    },
    {
      label: "HOW",
      title: "From box-open/fusion request to settled result",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "Register the rarity table", body: "At deploy time, a rarity table with per-tier odds (e.g. 94%/6%) is registered into the contract." },
            { title: "Request a signature", body: "When a user opens a box or attempts fusion, the server issues an EIP-712 signature." },
            { title: "Submit the on-chain request", body: "The user calls the box-open/fusion function with this signature. The contract recovers and verifies the signature against the server key before allowing execution." },
            { title: "Forward the VRF request", body: "After verification, the contract requests randomness from the internal VRF contract and waits in an unfulfilled state." },
            { title: "Worker polls and submits a value", body: "An operator worker polls for unfulfilled requests and submits an integer generated off-chain. Only the designated operator account can call this fulfillment function." },
            { title: "Settle the result", body: "The callback runs, and the final tier/result is fixed by randomness % total ratio (fusion) or randomness % list length (box open), with an event emitted." },
            { title: "Publish odds on the front end", body: "The front end shows users a table of per-tier odds derived from the rarity table." },
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
            { icon: Dices, title: "The source of randomness decides verifiability", body: "If a server worker's value is submitted on-chain rather than an on-chain oracle or cryptographic randomness, the guarantee is entirely different even when the interface matches VRF." },
            { icon: ShieldX, title: "Fulfillment authority concentrates in one operator account", body: "Having only a single designated account able to fulfill randomness is simple to implement, but that account becomes a single point of trust." },
            { icon: EyeOff, title: "Pre-prediction and post-verification are the real evaluation axes", body: "Even if the name and interface claim 'verifiable randomness', it only earns the VRF name when a third party can prove results weren't rigged." },
          ],
        },
      ],
    },
    { label: "DIAGRAM", title: "Box open → VRF request/fulfill sequence", blocks: [{ kind: "mermaid", chart: enChart }] },
    {
      label: "PROS",
      title: "Upsides of this pattern",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "Registering the rarity table at deploy time lets operators tune per-tier odds flexibly.",
            "Signature verification at the request stage means an arbitrary wallet can't open boxes or attempt fusion unconditionally.",
            "An odds-disclosure UI on the front end can show users per-tier odds transparently on the surface.",
          ],
        },
      ],
    },
    {
      label: "CONS",
      title: "Limits of this pattern",
      blocks: [
        {
          kind: "list",
          icon: AlertTriangle,
          tone: "destructive",
          items: [
            "It's named 'VRF' but isn't cryptographically verifiable randomness — no third party can prove results weren't rigged.",
            "When fulfillment authority concentrates in one account, that account is both a single point of failure and a single point of trust.",
            "Without an automated check that the odds table matches the real distribution, the published odds rest on operational trust rather than on code.",
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
            "Replace it with genuinely verifiable randomness like Chainlink VRF, or at minimum a commit-reveal scheme, to secure third-party verifiability.",
            "Fold a test that verifies the odds table matches the real distribution into CI at each deploy.",
            "Separate randomness-fulfillment authority from other operator powers like burn/mint, and introduce multisig where possible.",
          ],
        },
      ],
    },
  ],
};

const content: NoteContent = { ko, en };
export default content;
