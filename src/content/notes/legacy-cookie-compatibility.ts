import { CheckCircle2, AlertTriangle, Lightbulb, KeyRound, Tag, ShieldCheck, EyeOff, ArrowRightLeft } from "lucide-react";
import type { NoteBody, NoteContent } from "@/lib/note-content";

const koChart = `sequenceDiagram
    autonumber
    participant Auth as 인증 서버
    participant Browser as 브라우저

    Note over Auth: 로그인 성공, 사용자 정보 확보됨
    Auth->>Auth: 신규 쿠키용 값 생성 (JSON → AES-256-GCM 암호화, IV 매번 새로 생성)
    Auth-->>Browser: Set-Cookie (신규, HttpOnly)

    Auth->>Auth: 레거시 쿠키 A용 값 생성 (JSON → DES-CBC 암호화)
    Auth-->>Browser: Set-Cookie (레거시 A, HttpOnly)

    Auth->>Auth: 레거시 쿠키 B용 값 생성 (특정 규칙으로 MD5 해시 계산 후 key=value 조합)
    Auth-->>Browser: Set-Cookie (레거시 B, HttpOnly)

    Note over Browser: 세 쿠키 모두 브라우저에 저장됨 - 어떤 서비스로 이동해도 로그인 상태 유지`;

const enChart = `sequenceDiagram
    autonumber
    participant Auth as Auth server
    participant Browser as Browser

    Note over Auth: login succeeded, user info in hand
    Auth->>Auth: build new cookie value (JSON → AES-256-GCM, fresh IV each time)
    Auth-->>Browser: Set-Cookie (new, HttpOnly)

    Auth->>Auth: build legacy cookie A value (JSON → DES-CBC)
    Auth-->>Browser: Set-Cookie (legacy A, HttpOnly)

    Auth->>Auth: build legacy cookie B value (MD5 hash by a set rule, then key=value)
    Auth-->>Browser: Set-Cookie (legacy B, HttpOnly)

    Note over Browser: all three cookies stored - login state holds wherever you navigate`;

const ko: NoteBody = {
  intro: "로그인 성공 시 신규·레거시 쿠키를 동시에 발급해 여러 세대의 서비스가 함께 로그인 상태를 인식하도록 만든 구조를 정리했습니다.",
  sections: [
    {
      label: "PURPOSE — 목적",
      title: "왜 세 개나 필요한가",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "신규 로그인 서버와 레거시 시절부터 살아남은 서비스들이 같은 최상위 도메인을 공유합니다. 그래서 신규 서버가 로그인에 성공해도 아직 레거시 인증 방식을 쓰는 서비스가 이를 알아볼 수 있어야 했습니다. 서비스별로 쿠키를 읽는 암호화 방식과 파싱 규칙이 제각각이라 신규·레거시 쿠키 세 종류를 동시에 굽는 방식으로 호환성을 맞췄습니다.",
          ],
        },
      ],
    },
    {
      label: "HOW — 구현 방법",
      title: "로그인 성공 시 쓰기 흐름",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "신규 쿠키 값 생성", body: "로그인 성공 후 확보한 사용자 정보를 JSON으로 만들고, IV를 매번 새로 생성해 AES-256-GCM으로 암호화한다." },
            { title: "신규 쿠키 굽기", body: "Set-Cookie로 HttpOnly 신규 쿠키를 내려준다." },
            { title: "레거시 쿠키 A 값 생성", body: "같은 사용자 정보를 옛 C# 표준과 동일한 DES-CBC 방식으로 암호화한다." },
            { title: "레거시 쿠키 A 굽기", body: "Set-Cookie로 HttpOnly 레거시 쿠키 A를 내려준다." },
            { title: "레거시 쿠키 B 값 생성", body: "사용자 식별값과 서버 비밀키, 주 단위 시간값을 조합해 MD5 해시를 만들고 key=value 문자열로 조합한다." },
            { title: "레거시 쿠키 B 굽기", body: "Set-Cookie로 HttpOnly 레거시 쿠키 B를 내려준다. 세 쿠키 모두 브라우저에 저장되어 어떤 서비스로 이동해도 로그인 상태가 유지된다." },
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
            { icon: KeyRound, title: "쿠키마다 암호화 방식이 다르다", body: "신규 쿠키는 AES-256-GCM으로 굽는다. 레거시 쿠키 A는 옛 C# 표준과 바이트 단위로 동일한 DES-CBC를 쓴다. 레거시 쿠키 B는 암호화 없이 MD5 해시 서명만 붙인다." },
            { icon: Tag, title: "버전 접두사로 마이그레이션 여지를 남겼다", body: "신규 쿠키 값 앞에 버전 접두사를 붙여둔다. 나중에 암호화 방식을 다시 바꿔야 할 때 이전 버전과 구분할 수 있다." },
            { icon: ShieldCheck, title: "GCM 인증 태그로 변조를 즉시 탐지한다", body: "복호화 시 태그 검증에 실패하면 바로 에러가 나고, 그 사용자는 인증 필요 상태로 취급된다." },
            { icon: EyeOff, title: "레거시 쿠키 B는 사실 서명이지 암호화가 아니다", body: "값 자체(아이디 등)는 평문으로 보이지만, 해시가 맞아야 유효한 것으로 인정돼 값만 조작해서는 통과할 수 없다." },
            { icon: ArrowRightLeft, title: "읽기는 한쪽 방향으로만 흐른다", body: "신규 서비스 코드는 신규(AES-GCM) 쿠키만 읽는다. 레거시 쿠키 두 개는 다른 레거시 서비스가 읽으라고 내려주는 용도일 뿐이다." },
          ],
        },
      ],
    },
    { label: "DIAGRAM — 시퀀스", title: "시퀀스 다이어그램", blocks: [{ kind: "mermaid", chart: koChart }] },
    {
      label: "PROS — 장점",
      title: "이 구조가 좋은 이유",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "레거시 서비스를 건드리지 않고도 신규 인증 서버 하나로 SSO 범위를 넓혔다.",
            "GCM 인증 태그로 신규 쿠키의 변조를 즉시 탐지할 수 있다.",
            "버전 접두사 덕분에 향후 암호화 방식을 교체해도 하위 호환을 유지할 수 있다.",
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
            "쿠키를 세 개 굽고 관리해야 해서 로그인/로그아웃 로직이 그만큼 복잡해진다.",
            "레거시 쿠키 A(DES-CBC)는 IV를 키와 동일하게 고정해서 쓴다. 매번 랜덤 IV를 쓰는 신규 쿠키보다 훨씬 약한 방식이라, 레거시 서비스가 사라지기 전까지는 계속 유지해야 하는 부채다.",
            "로그아웃 시 세 쿠키 중 하나라도 빠뜨리면 반쪽짜리 로그아웃이 될 수 있어, 삭제 로직에서 항상 세 개를 함께 관리해야 한다.",
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
            "레거시 서비스들을 신규 인증 체계로 순차 이전해, 궁극적으로 레거시 쿠키 A/B 발급을 없앤다.",
            "레거시 쿠키 B의 MD5 서명을 더 강한 해시(HMAC-SHA256 등)로 교체할 수 있는지 레거시 서비스 쪽과 협의한다.",
            "쿠키 발급/삭제 로직을 한 곳에 모아, 세 종류를 빠뜨리지 않고 항상 함께 처리하도록 강제한다.",
          ],
        },
      ],
    },
  ],
};

const en: NoteBody = {
  intro: "How issuing new and legacy cookies at once on successful login lets several generations of services recognize the same login state.",
  sections: [
    {
      label: "PURPOSE",
      title: "Why three cookies",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The new login server and services that survived from legacy days share the same top-level domain. So even when the new server logs a user in, services still on the legacy auth scheme had to recognize it. Each service reads cookies with its own encryption and parsing rules, so I matched compatibility by baking three cookie types — new and legacy — at once.",
          ],
        },
      ],
    },
    {
      label: "HOW",
      title: "The write flow on successful login",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "Build the new cookie value", body: "Turn the user info obtained after login into JSON and encrypt it with AES-256-GCM, generating a fresh IV each time." },
            { title: "Bake the new cookie", body: "Send an HttpOnly new cookie via Set-Cookie." },
            { title: "Build legacy cookie A value", body: "Encrypt the same user info with DES-CBC, byte-for-byte identical to the old C# standard." },
            { title: "Bake legacy cookie A", body: "Send an HttpOnly legacy cookie A via Set-Cookie." },
            { title: "Build legacy cookie B value", body: "Combine the user identifier, a server secret, and a week-granularity timestamp into an MD5 hash, then assemble a key=value string." },
            { title: "Bake legacy cookie B", body: "Send an HttpOnly legacy cookie B via Set-Cookie. All three cookies are stored, so login state holds wherever you navigate." },
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
            { icon: KeyRound, title: "Each cookie uses a different encryption scheme", body: "The new cookie is baked with AES-256-GCM. Legacy cookie A uses DES-CBC, byte-for-byte identical to the old C# standard. Legacy cookie B has no encryption at all — just an MD5 hash signature." },
            { icon: Tag, title: "A version prefix leaves room to migrate", body: "The new cookie value carries a version prefix up front, so a later change of encryption scheme can be told apart from the previous version." },
            { icon: ShieldCheck, title: "The GCM auth tag detects tampering instantly", body: "If tag verification fails on decryption, it errors immediately and that user is treated as needing authentication." },
            { icon: EyeOff, title: "Legacy cookie B is really a signature, not encryption", body: "The value itself (id, etc.) is visible in plaintext, but it's only accepted as valid when the hash matches, so tampering with the value alone won't pass." },
            { icon: ArrowRightLeft, title: "Reads flow in only one direction", body: "New service code reads only the new (AES-GCM) cookie. The two legacy cookies exist purely for other legacy services to read." },
          ],
        },
      ],
    },
    { label: "DIAGRAM", title: "Sequence diagram", blocks: [{ kind: "mermaid", chart: enChart }] },
    {
      label: "PROS",
      title: "Why this design is good",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "It widened the SSO scope with a single new auth server, without touching legacy services.",
            "The GCM auth tag detects tampering of the new cookie instantly.",
            "The version prefix keeps backward compatibility even if the encryption scheme is swapped later.",
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
            "Baking and managing three cookies makes login/logout logic that much more complex.",
            "Legacy cookie A (DES-CBC) fixes the IV equal to the key — much weaker than the new cookie's random IV each time, a debt that must be kept until legacy services are gone.",
            "If even one of the three cookies is missed on logout, it can be a half-logout, so the deletion logic must always manage all three together.",
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
            "Migrate the legacy services onto the new auth scheme one by one, ultimately dropping legacy cookies A/B.",
            "Discuss with the legacy side whether legacy cookie B's MD5 signature can be replaced with a stronger hash (HMAC-SHA256, etc.).",
            "Consolidate cookie issue/delete logic in one place so all three types are always handled together without omission.",
          ],
        },
      ],
    },
  ],
};

const content: NoteContent = { ko, en };
export default content;
