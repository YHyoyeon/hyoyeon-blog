import { CheckCircle2, AlertTriangle, Lightbulb, Dices, ShieldX, Siren, EyeOff, Ban } from "lucide-react";
import type { NoteBody, NoteContent } from "@/lib/note-content";

const koChart = `sequenceDiagram
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

const enChart = `sequenceDiagram
    autonumber
    participant User as User wallet
    participant RB as RandomBox contract
    participant VRF as VRF contract (home-built)
    participant Worker as kingdomScan master-wallet worker

    User->>RB: OpenBox(tokenId, boxRarity, signature)
    RB-->>RB: verify signature (kingdomScan master key)
    RB->>VRF: requestRandomWords(...)
    VRF-->>VRF: store RequestStatus (fulfilled=false)

    loop polling every few seconds
        Worker->>VRF: query unfulfilled requests (requestIds)
        VRF-->>Worker: next unfulfilled requestId
        Worker-->>Worker: RandomWord = integer derived from Math.random()
        Worker->>VRF: MsFulfillRandomWords(reqId, [RandomWord])
    end

    VRF-->>RB: OnVrfResult(requestId, randomWords)
    RB-->>RB: rarity fixed via randomSeed % totalRatio (or % hero-list length)
    RB-->>User: final result settled (event emitted)`;

const ko: NoteBody = {
  intro: "박스·합성 결과의 등급을 결정하는 확률표와, 그 확률을 굴리는 'VRF'라는 이름의 난수 시스템이 실제로는 어떻게 동작하는지 정리했습니다.",
  sections: [
    {
      label: "PURPOSE — 목적",
      title: "왜 'VRF'라는 이름이 붙었는가",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "가챠형 랜덤박스는 결과 조작 의혹을 피하려면 난수 생성 과정이 검증 가능해야 합니다. 이 랜덤박스 컨트랙트도 체인링크 VRF와 같은 요청-이행(request/fulfill) 인터페이스를 그대로 본떠 만들었습니다. 다만 실제로 누가, 어떤 방식으로 그 난수 값을 채워 넣는지를 따라가 보면 이름이 암시하는 '검증 가능한 난수'와는 다른 동작을 한다는 걸 확인할 수 있습니다.",
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
            { title: "비율 테이블 등록", body: "운영진이 배포 시점에 등급별 확률(예: 94%/6%)을 담은 비율 테이블을 컨트랙트에 등록한다." },
            { title: "서명 발급 요청", body: "사용자가 박스를 열거나 합성을 시도하면 인덱싱 허브가 EIP-712 서명을 마스터 키로 발급한다." },
            { title: "온체인 요청 제출", body: "사용자가 이 서명과 함께 박스 오픈·합성 함수를 호출한다. 컨트랙트는 서명을 서버 마스터 키로 복원해 검증한 뒤에만 실행을 허용한다." },
            { title: "VRF 요청 전달", body: "검증을 통과하면 컨트랙트가 내부 VRF 컨트랙트에 난수를 요청하고, 미이행 상태로 대기한다." },
            { title: "워커가 폴링 후 값 제출", body: "인덱싱 허브의 마스터 지갑 워커가 미이행 요청을 주기적으로 폴링하다가, Math.random()으로 정수를 하나 생성해 온체인에 제출한다. 이 함수는 마스터로 지정된 단일 계정만 호출 가능하다." },
            { title: "결과 확정", body: "콜백이 실행되며 난수 % 총 비율(합성) 또는 난수 % 히어로 목록 길이(박스 오픈) 연산으로 최종 등급·결과가 확정되고 이벤트가 emit된다." },
            { title: "프론트엔드 확률 공개", body: "마켓플레이스 프론트엔드가 비율 테이블에서 파생된 등급별 획득 확률을 사용자에게 테이블로 보여준다." },
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
            { icon: ShieldX, title: "정식 fulfillRandomWords는 쓰이지 않는다", body: "컨트랙트에는 체인링크 스타일의 내부 전용 fulfillRandomWords가 있지만, 실제로 호출되는 건 마스터 지갑 전용의 별도 외부 함수다." },
            { icon: Dices, title: "난수의 출처는 서버의 Math.random()이다", body: "온체인 오라클이나 암호학적 난수가 아니라, 인덱싱 허브 워커 프로세스가 생성한 값을 그대로 온체인에 제출한다." },
            { icon: Siren, title: "테스트넷 제한 체크가 무력화되어 있다", body: "'테스트넷에서만 작동함'이라는 주석과 함께 체인ID 체크 코드가 남아있지만, 그 체크 자체가 주석 처리되어 실제로는 모든 네트워크(라이브 포함)에서 이 경로가 그대로 동작한다." },
            { icon: EyeOff, title: "결과를 사전에 예측하거나 사후 검증할 방법이 없다", body: "이름과 인터페이스는 '검증 가능한 난수'를 표방하지만, 실제로는 운영사가 통제하는 단일 지갑이 언제·어떤 값으로 결과를 확정할지 결정하는 구조다." },
            { icon: Ban, title: "박스 오픈 UI는 실제로 안 쓰이고 있을 수 있다", body: "확인 시점 기준으로 박스 오픈 관련 훅은 어떤 페이지에서도 import되지 않았고, 실제로 페이지에 연결된 건 합성(fusion) 쪽뿐이었다." },
          ],
        },
      ],
    },
    { label: "DIAGRAM — 시퀀스", title: "박스 오픈 → VRF 요청/이행 시퀀스", blocks: [{ kind: "mermaid", chart: koChart }] },
    {
      label: "PROS — 장점",
      title: "이 구조가 좋은 이유",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "비율 테이블을 배포 시점에 등록하는 방식이라, 등급별 확률을 운영진이 유연하게 조정할 수 있다.",
            "요청 단계에서 서명 검증을 거치기 때문에, 임의의 지갑이 아무 조건 없이 박스를 열거나 합성을 시도할 수 없다.",
            "프론트엔드에 확률 공개 UI가 실제로 존재해, 최소한 표면적으로는 사용자에게 등급별 확률을 투명하게 보여준다.",
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
            "이름은 'VRF'지만 암호학적으로 검증 가능한 난수가 아니다 — 결과가 조작되지 않았음을 제3자가 증명할 방법이 없다.",
            "소각·발행·VRF 이행을 모두 처리하는 마스터 지갑이 단일 장애점이자 단일 조작 가능 지점이 된다.",
            "테스트넷 전용으로 의도된 체크가 주석 처리된 채 라이브에도 적용되고 있어, 코드 주석과 실제 동작이 어긋나 있다.",
            "확률을 대량 반복해 실제 분포를 검증하는 스크립트가 존재했던 것으로 보이나, 관련 레포들의 현재 코드와 git 히스토리를 뒤져도 위치를 특정하지 못했다.",
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
            "체인링크 VRF 같은 실제 검증 가능한 난수 서비스, 또는 최소한 커밋-리빌 방식으로 교체하는 방안을 검토한다.",
            "테스트넷 전용 체크 주석의 의도를 재검토해, 실제로 필요 없다면 주석과 코드를 정리하고 필요하다면 다시 활성화한다.",
            "확률 검증 스크립트의 정확한 소재를 파악해 문서에 보강하고, 가능하다면 CI에 편입해 배포 시점마다 확률표와 실제 분포가 일치하는지 자동 검증한다.",
            "소각·발행·VRF 이행 권한을 하나의 마스터 지갑에 몰아주지 말고 기능별로 분리하는 방안을 검토한다.",
          ],
        },
      ],
    },
  ],
};

const en: NoteBody = {
  intro: "The rarity table that decides box/fusion outcomes, and what the randomness system named 'VRF' that rolls those odds actually does under the hood.",
  sections: [
    {
      label: "PURPOSE",
      title: "Why it's called 'VRF'",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "A gacha loot box needs a verifiable randomness pipeline to avoid rigging suspicions. This RandomBox contract was modeled directly on Chainlink VRF's request/fulfill interface. But follow who actually fills in the random value, and how, and you find behavior quite different from the 'verifiable randomness' the name implies.",
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
            { title: "Register the rarity table", body: "At deploy time, operators register a rarity table with per-tier odds (e.g. 94%/6%) into the contract." },
            { title: "Request a signature", body: "When a user opens a box or attempts fusion, the indexing hub issues an EIP-712 signature with the master key." },
            { title: "Submit the on-chain request", body: "The user calls the box-open/fusion function with this signature. The contract recovers and verifies the signature against the server's master key before allowing execution." },
            { title: "Forward the VRF request", body: "After verification, the contract requests randomness from the internal VRF contract and waits in an unfulfilled state." },
            { title: "Worker polls and submits a value", body: "The indexing hub's master-wallet worker polls for unfulfilled requests and submits an integer generated with Math.random() on-chain. Only the single account designated as master can call this function." },
            { title: "Settle the result", body: "The callback runs, and the final tier/result is fixed by randomness % total ratio (fusion) or randomness % hero-list length (box open), with an event emitted." },
            { title: "Publish odds on the front end", body: "The marketplace front end shows users a table of per-tier odds derived from the rarity table." },
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
            { icon: ShieldX, title: "The official fulfillRandomWords is never used", body: "The contract carries a Chainlink-style internal fulfillRandomWords, but what actually gets called is a separate external function reserved for the master wallet." },
            { icon: Dices, title: "The randomness comes from the server's Math.random()", body: "Not an on-chain oracle, not cryptographic randomness — a value generated by the indexing hub's worker process is submitted on-chain as-is." },
            { icon: Siren, title: "The testnet-only guard has been neutralized", body: "A chain-id check remains next to a comment saying 'testnet only', but the check itself is commented out — in practice this path runs unchanged on every network, live included." },
            { icon: EyeOff, title: "Results can be neither predicted in advance nor verified after the fact", body: "The name and interface claim 'verifiable randomness', but in reality a single operator-controlled wallet decides when, and with what value, each result is settled." },
            { icon: Ban, title: "The box-open UI may not actually be in use", body: "As of inspection, the box-open hooks weren't imported by any page — only the fusion side was actually wired to a page." },
          ],
        },
      ],
    },
    { label: "DIAGRAM", title: "Box open → VRF request/fulfill sequence", blocks: [{ kind: "mermaid", chart: enChart }] },
    {
      label: "PROS",
      title: "Why this design is good",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "Registering the rarity table at deploy time lets operators tune per-tier odds flexibly.",
            "Signature verification at the request stage means an arbitrary wallet can't open boxes or attempt fusion unconditionally.",
            "An odds-disclosure UI genuinely exists on the front end, so at least on the surface users see per-tier odds transparently.",
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
            "It's named 'VRF' but isn't cryptographically verifiable randomness — no third party can prove results weren't rigged.",
            "The master wallet that handles burns, mints, and VRF fulfillment is both a single point of failure and a single point of manipulation.",
            "A check intended as testnet-only is applied to live while commented out — the code comments and actual behavior disagree.",
            "A script that mass-repeated rolls to verify the real distribution appears to have existed, but combing the current code and git history of the related repos couldn't locate it.",
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
            "Evaluate replacing this with genuinely verifiable randomness like Chainlink VRF, or at minimum a commit-reveal scheme.",
            "Revisit the intent of the testnet-only comment — clean up the comment and code if truly unneeded, or re-enable the check if needed.",
            "Track down the odds-verification script, document it, and if possible fold it into CI to auto-verify that the odds table matches the real distribution at each deploy.",
            "Consider splitting burn/mint/VRF-fulfillment authority by function instead of concentrating it in one master wallet.",
          ],
        },
      ],
    },
  ],
};

const content: NoteContent = { ko, en };
export default content;
