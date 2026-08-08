import { AlertTriangle, Lightbulb, Database, FileSearch, Gauge, GitCommit, Ghost } from "lucide-react";
import LineChart, { type Pt } from "@/components/notes/LineChart";
import type { NoteBody, NoteContent } from "@/lib/note-content";

/* ---------- language-neutral chart data ---------- */

const incidentCpu: Pt[] = [
  [0, 2], [8, 1.5], [16, 2.5], [24, 2], [32, 1.5], [39.9, 2],
  [40.5, 88], [41.5, 12], [42.5, 95], [43.5, 6], [45, 72], [46, 10], [47, 98], [48.5, 8],
  [50, 90], [51, 15], [52.5, 100], [54, 5], [56, 84], [57, 12], [58.5, 97], [60, 7],
  [62, 92], [63, 10], [64.5, 99], [66, 6], [68, 78], [69, 14], [70.5, 96], [72, 8],
  [74, 88], [75, 11], [76.5, 100], [78, 5], [80, 93], [81, 9], [82.5, 55], [82.8, 4],
  [84, 3], [86, 2], [88, 3], [90, 3],
  [90.5, 35], [91.5, 75], [93, 92], [96, 97], [102, 96], [108, 98], [114, 97],
  [120, 98], [126, 96], [132, 98], [138.6, 98],
  [139.2, 12], [141, 8], [145, 7], [150, 9], [156, 8],
];

const deployApiCpu: Pt[] = [
  [0, 18], [5, 26], [10, 16], [15, 30], [20, 19], [25, 27], [30, 17], [35, 31],
  [40, 20], [45, 25], [50, 16], [55, 29], [60, 18], [65, 27], [70, 24], [73, 30],
  [75, 12], [78, 5], [85, 6], [95, 4], [105, 7], [115, 5], [125, 6], [135, 4],
  [145, 7], [155, 5], [165, 6], [175, 5], [180, 5],
];

const deployRedisCpu: Pt[] = [
  [0, 15.8], [20, 15.9], [40, 15.7], [60, 15.9], [70, 15.8], [73, 15.6],
  [76, 8], [78, 0.4], [90, 0.3], [110, 0.4], [130, 0.3], [150, 0.4], [170, 0.3], [180, 0.3],
];

const preFixCode = (c1: string, c2: string, c3: string) => `// pre-fix
const endBound = lastId ? \`(\${lastId}\` : '-';
let cursor = '+';
while (true) {
  const rows = await redis.xrevrange(key, cursor, endBound, 'COUNT', batch);
  if (!rows || rows.length === 0) break;                 // ${c1}
  for (const [id, kv] of rows)
    if (isMine(kv)) { latest = { id, kv }; break; }      // ${c2}
  if (latest) break;
  cursor = rows[rows.length - 1][0];                     // ${c3}
}`;

const fixCode = (c1: string, c2: string, c3: string) => `cursor = \`(\${rows[rows.length - 1][0]}\`;   // ${c1}
if (rows.length < batch) break;            // ${c2}
// ${c3}`;

function DeployCharts({
  apiTitle,
  redisTitle,
  unit,
  ticks,
  marker,
}: {
  apiTitle: string;
  redisTitle: string;
  unit: string;
  ticks: { v: number; label: string }[];
  marker: string;
}) {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <LineChart title={apiTitle} unit={unit} points={deployApiCpu} xMax={180} yMax={40} xTicks={ticks} yTicks={[0, 20, 40]} markers={[{ x: 73, label: marker }]} />
      <LineChart title={redisTitle} unit={unit} points={deployRedisCpu} xMax={180} yMax={20} xTicks={ticks} yTicks={[0, 10, 20]} markers={[{ x: 73, label: marker }]} />
    </div>
  );
}

const ko: NoteBody = {
  intro:
    "QA API 서버 CPU가 요청량과 무관하게 78~99%로 포화되고 스스로 회복하지 못했습니다. 원인은 9개월 전 머지된 SSE 백필의 XREVRANGE 커서 버그 — 빠진 한 글자 '('가 만든 불멸의 무한 루프를 추적한 기록입니다.",
  sections: [
    {
      label: "ROOT CAUSE — 근본 원인",
      title: "한 글자 '('가 만든 무한 루프",
      blocks: [
        { kind: "code", code: preFixCode("종료 1: 빈 결과", "종료 2: 내 이벤트", "버그: '(' 없이 갱신") },
        {
          kind: "list",
          icon: AlertTriangle,
          tone: "destructive",
          items: [
            "XREVRANGE의 end~start 범위는 양단 inclusive다. 페이징 커서에 exclusive 경계 '('를 안 붙이면 범위 끝에서 마지막 entry가 영원히 재등장한다. 이 코드는 최초 경계에만 '('를 붙였다.",
            "종료 조건이 '빈 결과 / 내 이벤트 발견' 뿐이라 스트림에 항목이 있는데 내 것이 없으면 둘 다 성립하지 않는다 — 무한 루프.",
            "백필은 await 없이 .catch만 붙인 fire-and-forget이라 SSE 연결이 끊겨도 Promise가 살아남는다. 조건을 밟은 연결 1회 = 죽지 않는 busy-loop 1개 적립.",
          ],
        },
      ],
    },
    {
      label: "WHY — 메커니즘",
      title: "await가 있는데 왜 CPU가 터졌나",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "await는 응답 대기 동안 이벤트 루프를 돌려주므로 블로킹은 아닙니다. 문제는 응답이 오자마자 다음 XREVRANGE를 재장전한다는 것 — 왕복이 끝나는 즉시 다음 콜백을 큐에 다시 넣는 자기재생 발화기가 됩니다. 루프 1개면 CPU가 조금 오르는 정도지만 수십 개가 누적되면 단일 스레드 이벤트 루프가 이 콜백들만 순회하며 유저 요청이 큐 뒤로 밀립니다. Redis는 빨라서 폭격을 맞고도 15% 수준 — 포화되는 건 질문을 퍼붓는 API 쪽입니다.",
          ],
        },
        {
          kind: "mermaid",
          chart: `sequenceDiagram
    participant EL as 이벤트 루프
    participant R as Redis
    loop 무한 스핀
        EL->>R: XREVRANGE 재조회
        R-->>EL: 같은 rows
        EL->>EL: 콜백 재장전
    end
    Note over EL: 유저 요청은 큐 뒤에서 계속 밀림`,
        },
      ],
    },
    {
      label: "DORMANCY — 잠복",
      title: "왜 9개월을 잠복했나",
      blocks: [
        {
          kind: "list",
          icon: Ghost,
          tone: "muted",
          items: [
            "스트림 키는 userId 기반 샤딩이라 여러 유저가 한 스트림을 공유한다. 스핀 성립 조건은 '연결 시점에 스트림에 48시간 내 entry가 있고 그중 본인 것이 0개'.",
            "QA는 이벤트 발행이 뜸해 48시간 트림으로 스트림이 대부분 비어 있었다. 빈 스트림이면 첫 조회가 빈 결과라 루프가 바로 끝난다 — 코드가 아니라 데이터 상태가 9개월을 지켜준 것.",
            "발행이 48시간 멈추면 스트림이 다시 비면서 살아 있던 루프도 자연 소멸한다. 장애가 스스로 꺼졌다 다시 생기는 이유가 여기 있었다.",
          ],
        },
      ],
    },
    {
      label: "GRAPH — 그래프 해부",
      title: "톱니 → 정지대 → 고원 → 급락",
      blocks: [
        {
          kind: "custom",
          node: (
            <LineChart
              title="API 컨테이너 CPU — 장애 6일간"
              unit="% · 실측 그래프의 모양을 다시 그림 (근사값)"
              points={incidentCpu}
              xMax={156}
              yMax={100}
              xTicks={[
                { v: 12, label: "발현 전" },
                { v: 40, label: "1일차" },
                { v: 88, label: "3일차" },
                { v: 114, label: "4일차" },
                { v: 148, label: "5일차 이후" },
              ]}
              yTicks={[0, 50, 100]}
              regions={[
                { from: 39.9, to: 82.8, label: "① 톱니" },
                { from: 82.8, to: 90, label: "②" },
                { from: 90, to: 138.6, label: "③ 고원" },
                { from: 138.6, to: 156, label: "④ 급락" },
              ]}
            />
          ),
        },
        {
          kind: "steps",
          steps: [
            { title: "톱니 (1~3일차) — OOM 크래시루프와의 합주", body: "별개 원인(의존성 일괄 범프)의 힙 OOM이 프로세스를 수십 분 주기로 죽였다. 크래시 → 스핀 전멸(골) → 재시작 → SSE 재연결 → 스핀 재적립(피크)의 반복이 0~100%를 오가는 톱니를 만들었다." },
            { title: "정지대 (3일차 낮) — 둘 다 조용해진 구간", body: "의존성 롤백으로 OOM이 멈췄고 마침 이 시간대엔 SSE 연결도 거의 없었다. 스핀이 성립하지 않아 CPU가 낮게 평탄해 보였다 — 회복된 게 아니라 방아쇠가 잠시 없었을 뿐." },
            { title: "고원 (3일차 저녁~5일차) — 악화의 안정화", body: "저녁부터 연결이 시간당 수십 건씩 꾸준히 유입되며 잔존 스트림 위에 불멸 스핀이 차곡차곡 쌓였다. 크래시라는 '리셋'이 사라지자 오히려 100% 고원으로 굳었다. 평탄 = 좋아진 게 아니라 나빠진 상태가 안정된 것." },
            { title: "급락 (5일차 저녁) — 데이터가 꺼 준 장애", body: "마지막 발행으로부터 48시간이 지나 트림으로 스트림이 비자 다음 조회가 빈 결과를 반환하며 루프가 일제히 소멸했다. 배포 없이 CPU가 평시로 복귀 — 방아쇠도 소화기도 데이터였다." },
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "같은 주에 별개 원인의 힙 OOM 장애가 겹치면서 두 장애가 증폭 고리를 만들었습니다. 서로 독립인 두 문제가 그래프 위에서는 하나의 무늬로 섞여 원인 추적을 흐렸습니다.",
          ],
        },
        {
          kind: "mermaid",
          chart: `graph TD
    OOM["OOM 크래시 (별개 장애)"] -->|재시작| KILL["스핀 전멸 — CPU 골"]
    KILL -->|SSE 재연결| SPIN["스핀 재적립 — CPU 피크"]
    SPIN -.->|수십 분 후| OOM`,
        },
      ],
    },
    {
      label: "INVESTIGATION — 조사",
      title: "세 개의 창으로 교차 검증",
      blocks: [
        {
          kind: "keypoints",
          items: [
            { icon: Database, title: "DB 이벤트 발행 로그 — 무장 시각을 특정", body: "장애 직전 5.4일간 발행 0건으로 빈 스트림 상태를 입증하고, 샤드별로 빈 스트림에 첫 entry가 박힌 '무장 시각'을 특정했다. 한 샤드는 최근 발행이 전부 한 명 — 그 샤드의 다른 모든 연결이 '남의 것만 있는' 조건에 걸렸다." },
            { icon: FileSearch, title: "애플리케이션 로그 — 불멸 스핀의 탄생 재구성", body: "무장 이후 같은 샤드에 비소유자 유저가 연결한 순간을 재구성해 스핀 1개의 탄생을 확인했다. 백필 에러 로그는 0건 — 루프는 throw 없이 조용히 돈다. 로그 부재가 부하 부재를 뜻하지 않는다." },
            { icon: Gauge, title: "Redis EngineCPU — 방향을 지목한 50배", body: "사건 전 0.3%였던 Redis EngineCPU가 고원 구간에 15%로 올랐다. Redis가 포화된 게 아니라 질문이 50배로 늘었다는 뜻 — 포화되는 쪽은 질문을 퍼붓는 API의 단일 스레드임을 지목했다." },
            { icon: GitCommit, title: "전환 vs 배포 — 상관관계와 인과의 분리", body: "장애 발현이 당일 배포보다 14.5시간 앞섰다. 배포는 방아쇠가 아니라 별개 OOM으로 증상을 증폭시켰을 뿐. '직전 배포 탓'이라는 첫 가설을 기각한 결정적 단서였다." },
          ],
        },
      ],
    },
    {
      label: "FIX — 수정과 검증",
      title: "수정은 한 글자, 방어는 네 겹",
      blocks: [
        { kind: "code", code: fixCode("exclusive 전진 (본질)", "마지막 페이지 조기 종료", "+ 페이지 상한(maxPages), 페이지 경계·emit 직전 연결 수명주기 가드") },
        {
          kind: "prose",
          paragraphs: [
            "회귀 테스트로 못을 박았습니다. pre-fix 커서로 되돌리면 '남의 것만 있는' 케이스가 미종료 + 폭주(2초에 13만 회 조회)하고 fix 코드는 XREVRANGE 2회 이하로 끝납니다. 라이브에서는 같은 샤드의 두 계정으로 성립 조건을 재현해 다량 동시 연결 후에도 CPU가 즉시 복귀하는 것을 확인했고, 배포 직후 API CPU와 Redis EngineCPU가 동시에 평시로 떨어지며 종결을 확인했습니다.",
          ],
        },
        {
          kind: "custom",
          node: (
            <DeployCharts
              apiTitle="API 컨테이너 CPU — 배포 전후 3시간"
              redisTitle="Redis EngineCPU — 배포 전후 3시간"
              unit="% (근사값)"
              ticks={[
                { v: 30, label: "-45분" },
                { v: 73, label: "배포" },
                { v: 120, label: "+45분" },
                { v: 165, label: "+90분" },
              ]}
              marker="fix 배포"
            />
          ),
        },
      ],
    },
    {
      label: "LESSONS — 교훈",
      title: "다음에 같은 실수를 안 하려면",
      blocks: [
        {
          kind: "list",
          icon: Lightbulb,
          tone: "muted",
          items: [
            "커서 페이지네이션은 반드시 exclusive 경계로 전진시킨다. 경계가 inclusive인 API(Redis Streams 등)에서 특히. '커서가 전진 못 할 수 있는가?'를 루프 리뷰의 기본 질문으로.",
            "while (true)에는 진행 보장 또는 상한을 명시한다. 종료 조건이 정상 데이터에만 의존하면 비정상 데이터에서 영원히 돈다.",
            "fire-and-forget 비동기는 소유자(수명주기)를 정한다. 요청·연결보다 오래 사는 Promise는 잠재 누수다.",
            "상관관계(직전 배포)와 인과를 구분한다. 방아쇠는 코드가 아니라 데이터·연결 상태일 수 있다. 배포 타임라인, 이분 프로브, 계측 세 겹으로 검증했다.",
            "겹친 장애는 분리한다. 별개 OOM의 톱니가 스핀 고원 위에 무늬를 씌워 원인 추적을 흐렸다.",
          ],
        },
      ],
    },
  ],
};

const en: NoteBody = {
  intro:
    "A QA API server's CPU saturated at 78–99% regardless of request volume and never recovered on its own. The cause was an XREVRANGE cursor bug in an SSE backfill merged 9 months earlier — the story of tracing an immortal infinite loop born from one missing '('.",
  sections: [
    {
      label: "ROOT CAUSE",
      title: "An infinite loop from one missing '('",
      blocks: [
        { kind: "code", code: preFixCode("exit 1: empty result", "exit 2: my event", "bug: advances without '('") },
        {
          kind: "list",
          icon: AlertTriangle,
          tone: "destructive",
          items: [
            "XREVRANGE's end–start range is inclusive on both ends. Without the exclusive boundary '(' on the paging cursor, the last entry at the range's edge reappears forever. This code applied '(' only to the initial boundary.",
            "The only exit conditions were 'empty result' or 'found my event', so when the stream has items but none are mine, neither holds — an infinite loop.",
            "The backfill was fire-and-forget with only a .catch and no await, so the Promise outlives a dropped SSE connection. One connection that hits the condition = one deathless busy-loop banked.",
          ],
        },
      ],
    },
    {
      label: "WHY",
      title: "There's an await — so why did CPU blow up?",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "await yields the event loop while waiting for a response, so it isn't blocking. The problem is that the moment a response arrives it reloads the next XREVRANGE — a self-regenerating igniter that re-queues the next callback the instant the round trip ends. One loop nudges CPU a little, but pile up dozens and the single-threaded event loop cycles through nothing but these callbacks while user requests slide to the back of the queue. Redis is fast enough to sit at ~15% under the barrage — what saturates is the API firing the questions.",
          ],
        },
        {
          kind: "mermaid",
          chart: `sequenceDiagram
    participant EL as Event loop
    participant R as Redis
    loop Infinite spin
        EL->>R: re-query XREVRANGE
        R-->>EL: same rows
        EL->>EL: reload callback
    end
    Note over EL: user requests keep piling up behind the queue`,
        },
      ],
    },
    {
      label: "DORMANCY",
      title: "Why it stayed dormant for 9 months",
      blocks: [
        {
          kind: "list",
          icon: Ghost,
          tone: "muted",
          items: [
            "Stream keys are sharded by userId, so multiple users share one stream. The spin triggers only when, at connect time, the stream has entries from the last 48h and zero of them are the connecting user's.",
            "On QA, events were published rarely, so the 48h trim left most streams empty. An empty stream means the first query returns nothing and the loop ends immediately — it was the data state, not the code, that held for 9 months.",
            "When publishing stops for 48h, the stream empties again and even live loops die out on their own. That's why the incident kept switching itself off and back on.",
          ],
        },
      ],
    },
    {
      label: "GRAPH",
      title: "Sawtooth → lull → plateau → drop",
      blocks: [
        {
          kind: "custom",
          node: (
            <LineChart
              title="API container CPU — 6 days of the incident"
              unit="% · redrawn from the real graph (approximate)"
              points={incidentCpu}
              xMax={156}
              yMax={100}
              xTicks={[
                { v: 12, label: "before onset" },
                { v: 40, label: "day 1" },
                { v: 88, label: "day 3" },
                { v: 114, label: "day 4" },
                { v: 148, label: "day 5+" },
              ]}
              yTicks={[0, 50, 100]}
              regions={[
                { from: 39.9, to: 82.8, label: "① sawtooth" },
                { from: 82.8, to: 90, label: "②" },
                { from: 90, to: 138.6, label: "③ plateau" },
                { from: 138.6, to: 156, label: "④ drop" },
              ]}
            />
          ),
        },
        {
          kind: "steps",
          steps: [
            { title: "Sawtooth (days 1–3) — in concert with an OOM crash loop", body: "A heap OOM from a separate cause (a bulk dependency bump) killed the process every few dozen minutes. Crash → spins wiped out (trough) → restart → SSE reconnect → spins re-accumulate (peak), repeating into a 0–100% sawtooth." },
            { title: "Lull (day 3, daytime) — a stretch where both went quiet", body: "Rolling back the dependency stopped the OOM, and this window happened to have almost no SSE connections. With no spins triggering, CPU looked low and flat — not recovered, just briefly without a trigger." },
            { title: "Plateau (day 3 evening – day 5) — a worsening that stabilized", body: "From the evening, connections flowed in steadily — dozens an hour — and immortal spins stacked up on the surviving streams. With the crash 'reset' gone, it froze into a 100% plateau instead. Flat didn't mean better; the worse state had stabilized." },
            { title: "Drop (day 5 evening) — the incident the data switched off", body: "48h after the last publish, the trim emptied the stream, the next query returned empty, and the loops died en masse. CPU returned to baseline with no deploy — both the trigger and the extinguisher were data." },
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "The same week, a heap-OOM incident from a separate cause overlapped, and the two formed an amplification loop. Two independent problems blended into a single pattern on the graph and muddied the root-cause hunt.",
          ],
        },
        {
          kind: "mermaid",
          chart: `graph TD
    OOM["OOM crash (separate incident)"] -->|restart| KILL["spins wiped out — CPU trough"]
    KILL -->|SSE reconnect| SPIN["spins re-accumulate — CPU peak"]
    SPIN -.->|tens of minutes later| OOM`,
        },
      ],
    },
    {
      label: "INVESTIGATION",
      title: "Cross-checked through three windows",
      blocks: [
        {
          kind: "keypoints",
          items: [
            { icon: Database, title: "DB publish log — pinpointing the arming time", body: "Zero publishes for the 5.4 days before the incident proved the empty-stream state, and per shard we pinpointed the 'arming time' when the first entry landed in an empty stream. On one shard the recent publishes were all from one person — every other connection on that shard hit the 'only someone else's' condition." },
            { icon: FileSearch, title: "Application log — reconstructing an immortal spin's birth", body: "By reconstructing the moment a non-owner connected to that same shard after arming, we confirmed the birth of a single spin. Backfill error logs: zero — the loop spins quietly with no throw. Absence of logs doesn't mean absence of load." },
            { icon: Gauge, title: "Redis EngineCPU — a 50× that pointed the direction", body: "Redis EngineCPU, 0.3% before the event, rose to 15% during the plateau. Not that Redis was saturated — the questions had multiplied 50×, pointing to the single thread of the question-firing API as the thing that saturates." },
            { icon: GitCommit, title: "Onset vs deploy — separating correlation from causation", body: "Onset preceded that day's deploy by 14.5 hours. The deploy wasn't the trigger; it merely amplified symptoms via a separate OOM. That was the decisive clue that rejected the first 'it was the last deploy' hypothesis." },
          ],
        },
      ],
    },
    {
      label: "FIX",
      title: "One character to fix, four layers to defend",
      blocks: [
        { kind: "code", code: fixCode("exclusive advance (the essence)", "early exit on the last page", "+ page cap (maxPages), plus connection-lifecycle guards at page boundaries and right before emit") },
        {
          kind: "prose",
          paragraphs: [
            "A regression test nailed it down. Revert to the pre-fix cursor and the 'only someone else's' case never terminates and runs away (130k queries in 2 seconds); the fixed code finishes in 2 or fewer XREVRANGE calls. In production we reproduced the trigger with two accounts on the same shard and confirmed CPU snaps back even after many concurrent connections; right after deploy, API CPU and Redis EngineCPU dropped to baseline together, confirming closure.",
          ],
        },
        {
          kind: "custom",
          node: (
            <DeployCharts
              apiTitle="API container CPU — 3h around deploy"
              redisTitle="Redis EngineCPU — 3h around deploy"
              unit="% (approximate)"
              ticks={[
                { v: 30, label: "-45m" },
                { v: 73, label: "deploy" },
                { v: 120, label: "+45m" },
                { v: 165, label: "+90m" },
              ]}
              marker="fix deploy"
            />
          ),
        },
      ],
    },
    {
      label: "LESSONS",
      title: "How not to repeat the same mistake",
      blocks: [
        {
          kind: "list",
          icon: Lightbulb,
          tone: "muted",
          items: [
            "Always advance a cursor with an exclusive boundary — especially on APIs where the boundary is inclusive (Redis Streams and the like). Make 'can this cursor fail to advance?' a default question in loop review.",
            "Give every while (true) an explicit progress guarantee or a cap. If the exit condition depends only on well-formed data, malformed data spins forever.",
            "Give fire-and-forget async an owner (a lifecycle). A Promise that outlives its request or connection is a latent leak.",
            "Distinguish correlation (the last deploy) from causation. The trigger may be data or connection state, not code. We verified across three layers: the deploy timeline, a bisection probe, and instrumentation.",
            "Separate overlapping incidents. A separate OOM's sawtooth laid a pattern over the spin plateau and blurred the root-cause trail.",
          ],
        },
      ],
    },
  ],
};

const content: NoteContent = { ko, en };
export default content;
