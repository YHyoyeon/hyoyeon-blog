/**
 * 새 글 템플릿. 이 파일을 `<slug>.ts`로 복사해서 쓴다. (이 파일 자체는 어디에도 import되지 않는다)
 *
 * 등록 3단계
 *   1. 이 파일을 `src/content/notes/<slug>.ts`로 복사하고 본문을 채운다
 *   2. `src/content/notes/index.ts` — import + `noteContent`에 `"<slug>": ...` 추가
 *   3. `src/lib/notes.ts` — `notes` 배열에 메타(slug·title·description·category·date) 추가.
 *      노출 순서는 `date` 내림차순(최신순)으로 자동 정렬된다. 배열 위치는 같은 날짜일 때만 의미가 있다.
 *      sitemap·feed·이전/다음 내비는 전부 이 둘에서 파생되므로 추가 등록은 없다.
 *
 * 표준 섹션 라벨 (14편 기준 관례 — ko는 접미사 있음, en은 접미사 없음)
 *   ko: PURPOSE — 목적 / HOW — 구현 방법 / KEY POINTS — 중요한 것 /
 *       PROS — 장점 / CONS — 단점 · 트레이드오프 / NEXT — 개선점
 *   en: PURPOSE / HOW / KEY POINTS / PROS / CONS / NEXT
 *   선택: DIAGRAM(ko는 `DIAGRAM — 시퀀스`처럼 접미사, 여러 개면 각각 다르게) ·
 *        STRUCTURE — 구조 · CACHE — 공유 전략 같은 글 고유 섹션은 PROS 앞에 끼워 넣는다.
 *
 * 블록 종류 (`src/lib/note-content.ts` 스키마)
 *   prose      문단. `paragraphs: string[]`
 *   steps      순서 있는 흐름. `{ title, body }[]` — HOW에 주로 쓴다
 *   keypoints  아이콘 + 제목 + 설명. KEY POINTS에 쓴다
 *   list       아이콘 목록. tone: accent(PROS) / destructive(CONS) / muted(NEXT)
 *   mermaid    다이어그램. 차트 문자열은 파일 상단에 ko/en 따로 상수로 뺀다
 *   code       코드블록(하이라이팅 없음, 공백 보존)
 *   custom     ReactNode 탈출구. 웬만하면 쓰지 말 것
 *
 * 규칙
 *   - ko/en은 섹션·블록 구조가 같아야 한다. 렌더러(NotePage)가 하나라 구조가 어긋나면 한쪽이 깨진다.
 *   - en이 없으면 `/en/notes/<slug>`가 빈 페이지가 된다. 번역 필수.
 *   - intro는 2~3문장. 글의 결론(무엇을 했고 결과가 얼마였나)을 먼저 말한다.
 */
import { CheckCircle2, AlertTriangle, Lightbulb, Layers } from "lucide-react";
import type { NoteContent } from "@/lib/note-content";

const koChart = `flowchart LR
    A["시작"] --> B["끝"]`;

const enChart = `flowchart LR
    A["start"] --> B["end"]`;

const content: NoteContent = {
  ko: {
    intro: "무엇을 했고, 결과가 어땠는지 2~3문장으로. 수치가 있으면 여기서 먼저 말한다.",
    sections: [
      {
        label: "PURPOSE — 목적",
        title: "왜 이걸 했나",
        blocks: [{ kind: "prose", paragraphs: ["배경과 문제. 무엇이 불편해서 시작했는지."] }],
      },
      // 선택 섹션 — 다이어그램이 없으면 통째로 지운다
      {
        label: "DIAGRAM — 흐름",
        title: "전체 흐름",
        blocks: [{ kind: "mermaid", chart: koChart }],
      },
      {
        label: "HOW — 구현 방법",
        title: "실제로 어떻게 했나",
        blocks: [
          { kind: "steps", steps: [{ title: "단계 제목", body: "그 단계에서 실제로 한 일." }] },
        ],
      },
      {
        label: "KEY POINTS — 중요한 것",
        title: "핵심 포인트",
        blocks: [
          {
            kind: "keypoints",
            items: [{ icon: Layers, title: "짚고 갈 사실 한 줄", body: "왜 그런지, 무엇이 근거인지." }],
          },
        ],
      },
      {
        label: "PROS — 장점",
        title: "좋았던 이유",
        blocks: [{ kind: "list", icon: CheckCircle2, tone: "accent", items: ["장점 — 근거."] }],
      },
      {
        label: "CONS — 단점 · 트레이드오프",
        title: "실제로 부딪힌 문제",
        blocks: [{ kind: "list", icon: AlertTriangle, tone: "destructive", items: ["단점 — 어떻게 드러났는지."] }],
      },
      {
        label: "NEXT — 개선점",
        title: "앞으로 개선하고 싶은 부분",
        blocks: [{ kind: "list", icon: Lightbulb, tone: "muted", items: ["다음에 할 것 — 왜."] }],
      },
    ],
  },
  en: {
    intro: "Two or three sentences on what was done and how it turned out. Lead with the numbers if there are any.",
    sections: [
      {
        label: "PURPOSE",
        title: "Why this was done",
        blocks: [{ kind: "prose", paragraphs: ["Background and problem — what was painful enough to start."] }],
      },
      { label: "DIAGRAM", title: "The overall flow", blocks: [{ kind: "mermaid", chart: enChart }] },
      {
        label: "HOW",
        title: "How it was actually built",
        blocks: [{ kind: "steps", steps: [{ title: "Step title", body: "What actually happened in this step." }] }],
      },
      {
        label: "KEY POINTS",
        title: "Key points",
        blocks: [
          {
            kind: "keypoints",
            items: [{ icon: Layers, title: "One-line fact worth pinning", body: "Why it's true and what backs it." }],
          },
        ],
      },
      {
        label: "PROS",
        title: "Why it worked well",
        blocks: [{ kind: "list", icon: CheckCircle2, tone: "accent", items: ["An upside — and the reason."] }],
      },
      {
        label: "CONS",
        title: "Problems actually hit",
        blocks: [{ kind: "list", icon: AlertTriangle, tone: "destructive", items: ["A downside — and how it surfaced."] }],
      },
      {
        label: "NEXT",
        title: "What I'd improve next",
        blocks: [{ kind: "list", icon: Lightbulb, tone: "muted", items: ["Next thing to do — and why."] }],
      },
    ],
  },
};

export default content;
