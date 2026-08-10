import { Network, Coins, Search, Timer, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";
import type { NoteBody, NoteContent } from "@/lib/note-content";

const koChart = `flowchart LR
    SRC["src/ · 2,019 파일"] --> AST["AST 추출<br/>결정적 · LLM 미사용 · 0 토큰"]
    SRC --> SEM["시맨틱 딥패스<br/>LLM · 도메인당 약 250k 토큰"]
    SEM --> CACHE["cache/semantic<br/>328KB · 유일하게 커밋"]
    AST --> G[("graph.json<br/>15,008 노드 / 45,555 엣지")]
    CACHE --> G
    G --> Q["query · path · explain<br/>질의당 약 4k 토큰"]
    G --> OUT["graph.html · GRAPH_REPORT.md<br/>gitignore"]`;

const enChart = `flowchart LR
    SRC["src/ · 2,019 files"] --> AST["AST extraction<br/>deterministic · no LLM · 0 tokens"]
    SRC --> SEM["semantic deep pass<br/>LLM · ~250k tokens per domain"]
    SEM --> CACHE["cache/semantic<br/>328KB · the only committed part"]
    AST --> G[("graph.json<br/>15,008 nodes / 45,555 edges")]
    CACHE --> G
    G --> Q["query · path · explain<br/>~4k tokens per query"]
    G --> OUT["graph.html · GRAPH_REPORT.md<br/>gitignored"]`;

const koCommands = `# 최초 빌드 — 방향 그래프로 만들어야 caller→callee 방향이 보존된다
graphify src --directed

# 코드가 바뀐 뒤 증분 갱신 (바뀐 파일만 재추출, 구조는 무료)
graphify src --update

# ❌ 한글 프로즈 → 노이즈 ("PCS"가 PcsTooManyRequestsException에 오매칭)
graphify query "혈당 예측은 어떻게 AI service와 PCS로 흘러가나?"

# ✅ 영문 심볼로 확장 → 정타 (소스 라인까지)
graphify query "GlucoseService GlucoseDataFetcher AiService \\
  PatientServerService afterPredict requestGlucosePrediction" --budget 3000

# 두 개념 사이 최단 경로 / 단일 노드 설명
graphify path "GlucoseService" "AiService"
graphify explain "JourneyCompletionProvider"`;

const enCommands = `# First build — build it directed, so caller→callee direction survives
graphify src --directed

# Incremental refresh after code changes (only changed files; structure is free)
graphify src --update

# ❌ Korean prose → noise ("PCS" mis-matches PcsTooManyRequestsException)
graphify query "혈당 예측은 어떻게 AI service와 PCS로 흘러가나?"

# ✅ Expanded into English symbols → direct hits, down to source lines
graphify query "GlucoseService GlucoseDataFetcher AiService \\
  PatientServerService afterPredict requestGlucosePrediction" --budget 3000

# Shortest path between two concepts / explain a single node
graphify path "GlucoseService" "AiService"
graphify explain "JourneyCompletionProvider"`;

const ko: NoteBody = {
  intro:
    "2,000여 파일짜리 NestJS 백엔드를 지식그래프로 만들어 아키텍처 질의에 써본 기록입니다. 구조 그래프는 0 토큰으로 만들어지고, 질의 1건은 약 51,800 → 4,000 토큰으로 줄었습니다. 모든 수치는 2026-07-31 src 기준 실측값입니다.",
  sections: [
    {
      label: "PURPOSE — 목적",
      title: "왜 코드베이스를 그래프로 만들었나",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "대형 레포에서 반복해서 나오는 질문은 대체로 같은 모양입니다. \"무엇이 무엇에 엮여 있나\", \"A에서 B까지 의존 경로가 어떻게 되나\", \"이 도메인의 경계는 어디까지인가\". 문제는 이 질문에 답할 때마다 grep을 돌리고 같은 파일 대여섯 개를 처음부터 다시 읽는다는 점이었습니다. 질문은 재사용되는데 조사 비용은 재사용되지 않았습니다.",
            "graphify는 폴더를 넣으면 코드를 노드·엣지로 바꿔주는 도구입니다. 클래스·함수·메서드가 노드가 되고 import·call·method·contains가 엣지가 됩니다. 결정적인 AST 파싱이라 LLM을 전혀 쓰지 않고, 그 위에 선택적으로 LLM 시맨틱 추출을 얹어 AST가 못 잡는 도메인 간 데이터 흐름·마이그레이션 대응·@deprecated 같은 설계 근거를 붙일 수 있습니다. 여기에 커뮤니티 탐지로 도메인 클러스터와 과결합 지점(god-node)까지 자동으로 표면화됩니다.",
            "핵심 기대는 하나였습니다. \"조사 결과를 한 번 만들어 두고 여러 번 질의한다.\" 실제로 그게 되는지, 비용은 얼마인지를 실측해 봤습니다.",
          ],
        },
      ],
    },
    {
      label: "DIAGRAM — 파이프라인",
      title: "빌드에서 질의까지",
      blocks: [{ kind: "mermaid", chart: koChart }],
    },
    {
      label: "HOW — 구현 방법",
      title: "이 레포에서 쓴 명령",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "설치", body: "패키지명은 graphifyy(y 두 개), 바이너리는 graphify다. uv tool install graphifyy 권장. API 키는 필요 없다 — 구조 추출은 순수 AST라 키 없이 돌고, 시맨틱만 Gemini 키 또는 호스트 에이전트를 쓴다." },
            { title: "대상은 레포 전체가 아니라 src", body: "레포 전체 2,418파일 대신 src(2,019파일)만 넣었다. 설정·픽스처·산출물이 그래프를 흐리는 걸 막는다." },
            { title: "반드시 --directed로 빌드", body: "방향 그래프여야 caller→callee, importer→imported 방향이 보존된다. 방향이 없으면 의존·경로·브릿지 질의의 답이 뭉개진다." },
            { title: "질의는 영문 심볼로", body: "매처가 case-fold 부분일치 + IDF뿐이라 스테밍·동의어·교차언어 매칭이 없다. 한글 프로즈는 노이즈만 나온다. 물어볼 개념을 노드 라벨과 겹치는 영문 심볼명으로 먼저 펼쳐서 넣는다." },
            { title: "정밀 플로우는 graph.json 직접 트래버스", body: "query CLI는 탐색용이다. 크로스도메인 엣지·유사도·하이퍼엣지를 정확히 뽑아야 할 때는 graph.json을 직접 훑는 편이 깔끔했다." },
          ],
        },
        { kind: "code", code: koCommands },
      ],
    },
    {
      label: "KEY POINTS — 중요한 것",
      title: "만드는 비용과 쓰는 비용",
      blocks: [
        {
          kind: "keypoints",
          items: [
            {
              icon: Network,
              title: "15,008 노드 / 45,555 엣지 / 432 커뮤니티",
              body: "산출물은 graph.json 약 25MB, graph.html 808KB. 엣지의 99.8%가 AST에서 뽑은 하드 팩트(EXTRACTED)이고 나머지가 시맨틱 추론이다. 즉 그래프의 대부분은 추측이 아니라 파싱 결과다.",
            },
            {
              icon: Coins,
              title: "구조 그래프 2,019파일 = 입력 토큰 0",
              body: "LLM을 쓰지 않으니 15k 노드 그래프가 말 그대로 공짜다. 토큰이 드는 건 선택한 도메인에만 돌리는 시맨틱 딥패스뿐 — glucose 34파일 245,693 · journey 37파일 251,704 · docs 3파일 58,125, 누적 555,522 토큰.",
            },
            {
              icon: Search,
              title: "질의 1건: 약 51,800 → 4,000 토큰 (약 13×)",
              body: "\"혈당 예측이 GlucoseService에서 AI service·PCS로 어떻게 흘러가나\"를 직접 조사하면 관련 6파일 정독만 약 51,791 토큰에 grep 왕복이 더 붙는다. 그래프는 1회 트래버스로 약 4,000 토큰, tool call 1회. 게다가 getGlucoseDataByDate ≈ execute 같은 마이그레이션 대응과 @deprecated 경고가 덤으로 나온다.",
            },
            {
              icon: Timer,
              title: "손익분기: 구조 질의는 1번째부터, 시맨틱은 5번째쯤",
              body: "구조 그래프가 공짜라 \"무엇이 무엇을 호출하나\"류는 첫 질의부터 이득이다. 시맨틱은 도메인당 약 250k를 선불로 내고 질의당 약 48k를 아끼니 대략 5질의에서 회수된다. 지연은 시맨틱 딥패스가 도메인당 5~6분(서브에이전트 2 병렬), 질의는 초 단위, 직접 6파일 읽기가 30~60초.",
            },
          ],
        },
      ],
    },
    {
      label: "CACHE — 공유 전략",
      title: "25MB 중 328KB만 커밋한 이유",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "산출물을 커밋할지 말지는 원래 \"전부 gitignore\"로 끝날 문제였습니다. 그런데 재생성 비용이 산출물마다 다르다는 게 걸렸습니다. graph.json 23MB는 누구나 0원에 다시 만들 수 있는 반면, 시맨틱 엣지는 다시 만들 때마다 LLM 호출이 발생합니다. 그래서 gitignore를 부정 패턴으로 뚫어 cache/semantic/(328KB · 71파일)만 예외로 공유했습니다. 팀 전체가 그 약 500k 토큰을 한 번만 지불하면 됩니다.",
            "이게 안전한 이유는 캐시 키가 파일 내용 해시이기 때문입니다. 파일이 바뀌면 해당 엔트리는 해시 불일치로 그냥 무시되고 재추출됩니다. 공유 캐시가 조용히 낡아서 틀린 답을 주는 시나리오가 없습니다. 내부 source_file도 상대경로라 clone 위치나 머신이 달라도 그대로 이식됩니다. 다만 대상 경로를 반드시 src로 맞춰야 합니다 — 캐시가 src/graphify-out/cache/에 있어 root=src일 때만 조회됩니다.",
          ],
        },
        {
          kind: "steps",
          steps: [
            { title: "graph.json (23MB) — 커밋 안 함", body: "소스에서 재생성 가능하고 코드가 바뀌면 즉시 낡는다. 거대 블롭이라 머지 충돌도 난다." },
            { title: "graph.html · manifest.json (~1MB) — 커밋 안 함", body: "같은 이유. 생성물이고 금방 낡는다." },
            { title: "cache/stat-index.json (274KB) — 커밋 안 함", body: "파일 stat 메타라 재생성이 즉시 끝난다. 공유할 가치가 없다." },
            { title: "cache/semantic/ (328KB · 71파일) — 커밋함", body: "LLM 추출분. 재생성이 유일하게 유료인 산출물이라 이것만 공유한다." },
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "src/ 밑에 .json을 커밋하는데도 CI는 깨지지 않았습니다. 검사들이 이미 .ts만 보고 있었기 때문입니다 — lint는 변경된 (src|apps|libs|test)/**/*.ts만, nest build의 tsc는 .ts만 컴파일, jest는 *.test.ts만, gitleaks는 시크릿 없는 그래프 메타를 무시합니다. 단 Docker만 예외 처리가 필요했습니다. Dockerfile의 COPY . . 이 루트 graphify-out/(25MB)을 빌드 컨텍스트로 밀어 넣고 커밋된 캐시가 빌드·테스트 이미지 레이어에 섞이기 때문에 .dockerignore에 graphify-out을 추가했습니다. .dockerignore는 git 추적과 무관하므로 캐시는 레포에 그대로 남습니다.",
          ],
        },
      ],
    },
    {
      label: "PROS — 장점",
      title: "실제로 이득이었던 지점",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "구조 그래프가 완전 무료다 — LLM을 안 쓰니 15k 노드 그래프를 만드는 데 토큰이 0이고, 그래서 구조 질의는 첫 질의부터 이득이다.",
            "반복 질의 비용이 거의 사라진다 — 직접 조사는 질문마다 같은 파일을 다시 읽지만, 그래프는 한 번 만들어 두고 질의당 약 4k 토큰으로 끝난다.",
            "무엇을 grep할지 몰라도 관통 지점이 드러난다 — god-node와 커뮤니티 탐지가 과결합 지점과 도메인 경계를 자동으로 표면화한다.",
            "정독으로는 놓치는 것을 잡는다 — 레거시↔신규 대응 관계나 @deprecated 경로처럼, 파일을 다 읽어야 겨우 보이는 것들이 시맨틱 딥패스에서 먼저 나온다.",
            "결과가 공유 가능한 산출물이다 — 인터랙티브 HTML, GraphRAG용 JSON, 감사 리포트가 함께 나와 조사 결과가 개인 컨텍스트에 갇히지 않는다.",
            "엣지의 99.8%가 하드 팩트라 신뢰 구간이 분명하다 — 어디까지가 파싱이고 어디부터가 추론인지 구분해서 읽을 수 있다.",
          ],
        },
      ],
    },
    {
      label: "CONS — 단점 · 트레이드오프",
      title: "실제로 부딪힌 문제",
      blocks: [
        {
          kind: "list",
          icon: AlertTriangle,
          tone: "destructive",
          items: [
            "한글 질의가 사실상 안 된다 — 매처가 case-fold 부분일치 + IDF뿐이라 \"PCS\"가 PcsTooManyRequestsException에 오매칭된다. 질문을 영문 심볼로 번역하는 건 결국 사람 몫이다.",
            "그래프는 스냅샷이라 낡는다 — 라이브 코드가 항상 정본이고, 중요한 판단 전에는 --update로 갱신하거나 실제 파일로 재확인해야 한다.",
            "수동 시맨틱 딥패스는 노드 ID가 정확히 맞아야 붙는다 — 서브에이전트가 만든 엣지 ID가 AST 노드 ID와 어긋나면 dangling으로 조용히 드롭된다. 실제 노드 ID를 뽑아 예시로 넘겨야 했다.",
            "dangling 엣지 경고가 겁을 준다 — 대부분은 node_modules·TypeORM·NestJS 같은 외부 심볼 참조라 빌드 시 드롭되고 graph.json엔 영향이 없는데, 헬스체크 출력만 보면 그래프가 깨진 것처럼 보인다.",
            "산출물이 크다 — graph.json 25MB. gitignore와 .dockerignore를 둘 다 손봐야 레포와 빌드 컨텍스트가 오염되지 않는다.",
            "시맨틱은 도메인당 약 250k 토큰의 선불이다 — 두세 번 물어보고 말 도메인이면 그냥 파일을 읽는 게 싸다.",
          ],
        },
      ],
    },
    {
      label: "NEXT — 개선점",
      title: "앞으로 다듬고 싶은 부분",
      blocks: [
        {
          kind: "list",
          icon: Lightbulb,
          tone: "muted",
          items: [
            "갱신을 자동화한다 — 지금은 사람이 --update를 기억해야 한다. 구조 변화가 큰 머지 이후에 증분 갱신이 돌게 하면 스냅샷 낡음 문제가 대부분 사라진다.",
            "한글 질문 → 영문 심볼 확장을 앞단에서 처리한다. 매처를 못 고치면 질의 입력을 고치는 쪽이 현실적이다.",
            "시맨틱 딥패스 대상 도메인을 넓힌다 — 지금은 glucose·journey 둘뿐이다. 질의가 반복되는 도메인부터 손익분기(약 5질의)를 넘길 곳을 골라 늘린다.",
            "공유 캐시의 히트율을 관측한다 — 빌드 로그의 \"N files hit from cache\"를 기록해 두면, 캐시를 커밋한 판단이 실제로 팀 토큰을 아꼈는지 사후에 검증할 수 있다.",
          ],
        },
      ],
    },
  ],
};

const en: NoteBody = {
  intro:
    "Notes from turning a ~2,000-file NestJS backend into a knowledge graph and using it to answer architecture questions. The structural graph costs zero tokens to build, and one query dropped from ~51,800 to ~4,000 tokens. All figures are measured on src as of 2026-07-31.",
  sections: [
    {
      label: "PURPOSE",
      title: "Why turn a codebase into a graph",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "In a large repo the recurring questions all have the same shape. What is wired to what? What's the dependency path from A to B? Where does this domain actually end? The problem was that answering each one meant running grep again and re-reading the same five or six files from the top. The questions were reused; the investigation was not.",
            "graphify takes a folder and turns the code into nodes and edges — classes, functions, and methods become nodes; import, call, method, and contains become edges. That part is deterministic AST parsing with no LLM involved. On top of it you can optionally run LLM semantic extraction to capture what AST can't see: cross-domain data flow, legacy-to-new mappings, @deprecated rationale. Community detection then surfaces domain clusters and over-coupled god-nodes on its own.",
            "The bet was simple: pay for the investigation once, query it many times. This is what it actually cost.",
          ],
        },
      ],
    },
    {
      label: "DIAGRAM",
      title: "From build to query",
      blocks: [{ kind: "mermaid", chart: enChart }],
    },
    {
      label: "HOW",
      title: "The commands actually used",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "Install", body: "The package is graphifyy (two y's); the binary is graphify. uv tool install graphifyy is the easy path. No API key needed — structural extraction is pure AST, and only the semantic pass needs a Gemini key or a host agent." },
            { title: "Target src, not the whole repo", body: "I fed it src (2,019 files) instead of the full 2,418-file repo, so config, fixtures, and build output don't muddy the graph." },
            { title: "Always build --directed", body: "A directed graph preserves caller→callee and importer→imported. Without direction, dependency, path, and bridge queries all blur together." },
            { title: "Query in English symbols", body: "The matcher is case-fold substring plus IDF — no stemming, no synonyms, no cross-language matching. Korean prose returns pure noise. Expand the concept into symbol names that overlap actual node labels first." },
            { title: "Traverse graph.json directly for precise flows", body: "The query CLI is for exploration. When you need cross-domain edges, similarities, and hyperedges exactly, walking graph.json yourself was cleaner." },
          ],
        },
        { kind: "code", code: enCommands },
      ],
    },
    {
      label: "KEY POINTS",
      title: "What it costs to build, and to use",
      blocks: [
        {
          kind: "keypoints",
          items: [
            {
              icon: Network,
              title: "15,008 nodes / 45,555 edges / 432 communities",
              body: "Output is a ~25MB graph.json and an 808KB graph.html. 99.8% of edges are hard facts extracted from the AST; the rest are semantic inferences. Most of the graph is parsing, not guessing.",
            },
            {
              icon: Coins,
              title: "2,019 files of structural graph = 0 input tokens",
              body: "No LLM, so a 15k-node graph is literally free. Tokens only go to the semantic deep pass on domains you pick — glucose 34 files / 245,693, journey 37 files / 251,704, docs 3 files / 58,125, for 555,522 cumulative.",
            },
            {
              icon: Search,
              title: "One query: ~51,800 → ~4,000 tokens (~13×)",
              body: "Answering \"how does glucose prediction flow from GlucoseService into the AI service and PCS\" by hand meant reading six files — about 51,791 tokens, plus grep round-trips. One graph traversal answered it in ~4,000 tokens and a single tool call, and threw in the migration mapping (getGlucoseDataByDate ≈ execute) and @deprecated warnings for free.",
            },
            {
              icon: Timer,
              title: "Break-even: query #1 for structure, roughly #5 for semantics",
              body: "Because the structural graph is free, \"what calls what\" pays off on the very first question. Semantics costs ~250k up front per domain and saves ~48k per query, so it clears at about five queries. Latency: 5–6 minutes per domain for the deep pass (two subagents in parallel), seconds per query, 30–60 seconds to read six files by hand.",
            },
          ],
        },
      ],
    },
    {
      label: "CACHE",
      title: "Why only 328KB of 25MB got committed",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Whether to commit the output looked like a settled question — gitignore all of it. What complicated it was that regeneration cost differs per artifact. Anyone can rebuild the 23MB graph.json for free, but every semantic edge costs another LLM call. So the gitignore carves out one negation and shares only cache/semantic/ (328KB, 71 files). The team pays that ~500k tokens once.",
            "This is safe because cache keys are content hashes. Change a file and its entry simply fails to match and gets re-extracted — there's no scenario where a stale shared cache quietly serves a wrong answer. The internal source_file paths are relative, so the cache travels across clone locations and machines. The one requirement is targeting src: the cache lives in src/graphify-out/cache/ and is only consulted when root=src.",
          ],
        },
        {
          kind: "steps",
          steps: [
            { title: "graph.json (23MB) — not committed", body: "Regenerable from source, stale the moment code changes, and a giant blob that invites merge conflicts." },
            { title: "graph.html · manifest.json (~1MB) — not committed", body: "Same reasoning: generated, and stale fast." },
            { title: "cache/stat-index.json (274KB) — not committed", body: "Just file stat metadata; regenerating it is instant, so there's nothing to share." },
            { title: "cache/semantic/ (328KB · 71 files) — committed", body: "The LLM-extracted part. It's the only artifact whose regeneration actually costs money, so it's the only one shared." },
          ],
        },
        {
          kind: "prose",
          paragraphs: [
            "Committing .json files under src/ didn't break CI, because every check already looks only at .ts — lint runs on changed (src|apps|libs|test)/**/*.ts, nest build's tsc compiles only .ts, jest only picks up *.test.ts, and gitleaks finds nothing in secret-free graph metadata. Docker was the one exception: COPY . . would ship the root graphify-out/ (25MB) into the build context and bake the committed cache into build and test image layers, so graphify-out went into .dockerignore. Since .dockerignore has nothing to do with git tracking, the cache still stays in the repo.",
          ],
        },
      ],
    },
    {
      label: "PROS",
      title: "Where it actually paid off",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "The structural graph is genuinely free — no LLM means zero tokens for a 15k-node graph, which is why structural queries win from the very first one.",
            "Repeat-query cost nearly disappears — manual investigation re-reads the same files per question; the graph is built once and answers for ~4k tokens a query.",
            "Cross-cutting hotspots surface without knowing what to grep for — god-node detection and communities expose over-coupling and domain boundaries on their own.",
            "It catches what close reading misses — legacy-to-new mappings and @deprecated paths, the kind of thing you only spot after reading every file, come out of the semantic pass first.",
            "The result is a shareable artifact — interactive HTML, GraphRAG-ready JSON, and an audit report mean the investigation isn't trapped in one person's context.",
            "99.8% hard-fact edges make the confidence boundary explicit — you can tell parsing from inference while reading.",
          ],
        },
      ],
    },
    {
      label: "CONS",
      title: "Problems actually hit",
      blocks: [
        {
          kind: "list",
          icon: AlertTriangle,
          tone: "destructive",
          items: [
            "Korean queries effectively don't work — with only case-fold substring matching and IDF, \"PCS\" mis-matches PcsTooManyRequestsException. Translating the question into English symbols stays a human job.",
            "The graph is a snapshot, so it goes stale — live code is always the source of truth, and anything important needs an --update or a re-check against the real files.",
            "A manual semantic deep pass only lands if node IDs match exactly — edge IDs produced by a subagent that don't line up with AST node IDs are silently dropped as dangling. I had to pull real node IDs and pass them as examples.",
            "The dangling-edge warning is scarier than it is — most of it is external symbols (node_modules, TypeORM, NestJS) that get dropped at build time with no effect on graph.json, but the health-check output reads like a broken graph.",
            "The output is big — 25MB of graph.json. Both .gitignore and .dockerignore need edits to keep the repo and the build context clean.",
            "Semantics is a ~250k-token prepayment per domain — for a domain you'll only ask about two or three times, just read the files.",
          ],
        },
      ],
    },
    {
      label: "NEXT",
      title: "What I'd refine next",
      blocks: [
        {
          kind: "list",
          icon: Lightbulb,
          tone: "muted",
          items: [
            "Automate the refresh — today someone has to remember --update. Running the incremental pass after structurally significant merges would erase most of the staleness problem.",
            "Handle Korean-to-symbol expansion at the front door. If the matcher can't be fixed, fixing the query input is the practical move.",
            "Widen the semantic deep pass beyond glucose and journey — pick the next domains by which ones get asked about often enough to clear the ~5-query break-even.",
            "Track shared-cache hit rate — logging the \"N files hit from cache\" line would let us verify after the fact that committing the cache really did save the team tokens.",
          ],
        },
      ],
    },
  ],
};

const content: NoteContent = { ko, en };

export default content;
