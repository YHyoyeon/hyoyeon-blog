import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  KeyRound,
  Lock,
  Layers,
  Scale,
  Hash,
  Fingerprint,
  ShieldCheck,
  EyeOff,
  Stamp,
  BadgeCheck,
  Binary,
  ListChecks,
  Server,
  Network,
  UserCheck,
  RefreshCw,
  Database,
} from "lucide-react";
import type { NoteBody, NoteContent } from "@/lib/note-content";

const koHandshake = `sequenceDiagram
    participant C as 클라이언트
    participant S as 서버
    Note over S: 키 쌍 생성 (공개키 + 개인키), 개인키는 밖으로 안 나감
    S->>C: 공개키 전달
    Note over C: 대칭키 생성
    C->>S: 대칭키를 서버 공개키로 암호화해 전송
    Note over S: 개인키로 복호화 → 대칭키 확보
    Note over C,S: 이후 통신은 공유한 대칭키로 암·복호화 (빠름)`;

const enHandshake = `sequenceDiagram
    participant C as Client
    participant S as Server
    Note over S: generate key pair (public + private); private never leaves
    S->>C: send public key
    Note over C: generate a symmetric key
    C->>S: encrypt the symmetric key with the server's public key
    Note over S: decrypt with private key → now holds the symmetric key
    Note over C,S: from here, traffic uses the shared symmetric key (fast)`;

const koCa = `sequenceDiagram
    participant B as 브라우저
    participant S as 서버
    participant CA as 인증기관(CA)
    Note over CA: CA 개인키로 (서버 공개키 + 도메인)에 서명 → 인증서
    S->>B: 인증서 전달 (서버 공개키 + CA 서명 포함)
    Note over B: 미리 내장된 CA 공개키로 서명 검증
    Note over B: 검증 성공 → 이 공개키를 신뢰`;

const enCa = `sequenceDiagram
    participant B as Browser
    participant S as Server
    participant CA as Certificate Authority
    Note over CA: CA signs (server public key + domain) with its private key → certificate
    S->>B: send certificate (server public key + CA signature)
    Note over B: verify the signature with a built-in CA public key
    Note over B: verified → trust this public key`;

const koEnvelope = `sequenceDiagram
    participant A as 앱
    participant K as KMS (마스터 키 보관)
    participant D as 저장소
    A->>K: 데이터 키(DEK) 발급 요청
    K-->>A: 평문 DEK + 마스터 키로 암호화된 DEK
    Note over A: 평문 DEK로 데이터 암호화 후, 평문 DEK는 즉시 폐기
    A->>D: 암호문 + 암호화된 DEK 함께 저장
    Note over A,D: 복호화할 땐 암호화된 DEK만 KMS에 보내 복호화 요청`;

const enEnvelope = `sequenceDiagram
    participant A as App
    participant K as KMS (holds master key)
    participant D as Storage
    A->>K: request a data key (DEK)
    K-->>A: plaintext DEK + DEK encrypted by the master key
    Note over A: encrypt data with the plaintext DEK, then discard the plaintext DEK
    A->>D: store ciphertext + the encrypted DEK together
    Note over A,D: to decrypt, send only the encrypted DEK to KMS`;

const koOauth = `sequenceDiagram
    participant U as 사용자 (자원 소유자)
    participant C as 클라이언트 (앱)
    participant A as 인가 서버
    participant R as 자원 서버
    C->>U: 인가 서버로 이동 (로그인·동의 요청)
    U->>A: 로그인 + 접근 동의
    A->>C: 1회용 인가 코드 전달 (리다이렉트)
    C->>A: 코드 + 클라이언트 자격증명 → 토큰 교환 (뒤채널)
    A->>C: access token 발급
    C->>R: access token 제시
    R->>C: 데이터 반환`;

const enOauth = `sequenceDiagram
    participant U as User (resource owner)
    participant C as Client (app)
    participant A as Authorization server
    participant R as Resource server
    C->>U: redirect to the authorization server (login + consent)
    U->>A: log in + approve access
    A->>C: return a single-use authorization code (redirect)
    C->>A: code + client credentials → exchange for a token (back channel)
    A->>C: issue access token
    C->>R: present access token
    R->>C: return data`;

const koJwt = `// JWT = header.payload.signature  (점 두 개로 구분)
eyJhbGciOiJIUzI1NiJ9 . eyJ1c2VySWQiOjEsInJvbGUiOiJ1c2VyIn0 . 3Vr8K2...
└──── header ───────┘   └──────── payload ────────────────┘   └ signature ┘

// header·payload : Base64URL 인코딩일 뿐 (암호화 아님, 누구나 디코드 가능)
// signature      : HMAC_SHA256(header + "." + payload, 서버만 아는 secret)`;

const enJwt = `// JWT = header.payload.signature  (split by two dots)
eyJhbGciOiJIUzI1NiJ9 . eyJ1c2VySWQiOjEsInJvbGUiOiJ1c2VyIn0 . 3Vr8K2...
└──── header ───────┘   └──────── payload ────────────────┘   └ signature ┘

// header, payload : just Base64URL encoding (NOT encryption; anyone can decode)
// signature       : HMAC_SHA256(header + "." + payload, a server-only secret)`;

const koBcrypt = `$2b$10$N9qo8uLOickgx2ZMRZoMye  IjZAgcfl7p92ldGxad68LJZdL17lhWy
 │   │  └──── 솔트(22자) ─────┘ └──────── 해시 결과(31자) ────────┘
 │   └ 비용(cost): 2^10 = 1024회 반복  ← 키 스트레칭
 └ 알고리즘 식별자(bcrypt)

// 솔트와 반복 횟수가 해시 문자열 안에 함께 저장된다 → 검증 때 그대로 재현`;

const enBcrypt = `$2b$10$N9qo8uLOickgx2ZMRZoMye  IjZAgcfl7p92ldGxad68LJZdL17lhWy
 │   │  └──── salt (22 ch) ───┘ └──────── hash output (31 ch) ─────┘
 │   └ cost: 2^10 = 1024 rounds  ← key stretching
 └ algorithm id (bcrypt)

// the salt and round count live inside the hash string → reproduced at verify time`;

const ko: NoteBody = {
  intro:
    "로그인, 결제, 토큰 검증까지 백엔드 곳곳에 암호화와 인증이 깔려 있지만, 대칭·비대칭·해시·인코딩·서명·토큰이 자주 뒤섞여 헷갈린다. 하이브리드 암호화부터 전자서명, 키 관리(KMS), OAuth 2.0·OIDC까지 실무에서 쓰는 개념을 초급에서 심화 순서로 한 흐름에 정리한다. (TLS 1.3의 키 교환은 별도 글에서 다룬다.)",
  sections: [
    {
      label: "HYBRID — 하이브리드 암호화",
      title: "왜 대칭키와 비대칭키를 같이 쓰나",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "대칭키 암호화(AES)는 하나의 키로 잠그고 같은 키로 푼다. 빠르지만, 그 키를 상대에게 어떻게 안전하게 전달하느냐가 문제다.",
            "비대칭키 암호화(RSA)는 공개키·개인키 한 쌍을 쓴다. 공개키로 잠근 건 개인키로만 풀리고, 그 반대도 성립한다. 느리지만 '키 전달' 문제를 푼다.",
            "그래서 둘을 합친다. 비대칭키로는 '대칭키 하나'만 안전하게 전달하고, 이후 실제 데이터는 빠른 대칭키로 주고받는다. 이것이 하이브리드 암호화이고, HTTPS 통신의 기본 구조다.",
          ],
        },
        {
          kind: "steps",
          steps: [
            { title: "공개키 전달", body: "서버가 공개키를 클라이언트에 보낸다. 개인키는 서버가 보관하고 밖으로 내보내지 않는다." },
            { title: "대칭키 생성·전송", body: "클라이언트가 대칭키를 만들어 서버의 공개키로 암호화한 뒤 보낸다." },
            { title: "대칭키 복호화", body: "서버가 자기 개인키로 복호화해 같은 대칭키를 확보한다." },
            { title: "대칭키로 본 통신", body: "이제 양쪽이 동일한 대칭키를 공유한다. 이후 데이터는 빠른 대칭키로 암·복호화한다." },
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: ListChecks, title: "용어: 개인키(private) ≠ 비밀키(secret)", body: "공개키(public key)와 개인키(private key)는 비대칭키 한 쌍이고, 비밀키(secret key)는 대칭키다. 개인키를 '비밀키'라고 혼용해 부르는 사람이 많지만, 비밀키는 대칭키를 가리키는 다른 개념이므로 구분해서 써야 한다." },
            { icon: Layers, title: "키 쌍은 수학적으로 한 번에 생성된다", body: "공개키와 개인키는 수학적으로 짝을 이뤄 한 번의 생성 명령으로 동시에 만들어진다. 둘은 서로 다른 파일로 저장되고 확장자도 다르다 — 예를 들어 개인키는 private.key, 공개키는 public.key(.pem·.pub 등)로 나뉜다." },
            { icon: KeyRound, title: "잠근 키의 반대 키로만 풀린다", body: "공개키로 암호화하면 개인키로만 풀 수 있고, 개인키로 암호화(서명)하면 공개키로만 풀 수 있다. 한 키로 잠그면 반드시 짝이 되는 다른 키로만 열린다." },
            { icon: EyeOff, title: "공개키는 가로채여도 안전하다", body: "공개키로 잠근 건 개인키로만 풀린다. 그래서 공개키는 숨길 필요가 없고, 서버는 개인키가 아니라 공개키를 보낸다." },
            { icon: KeyRound, title: "개인키를 보내면 안 되는 이유", body: "개인키를 보내면 중간에서 가로챈 공격자도 대칭키를 복호화하거나 위조할 수 있다. 개인키는 서버 밖으로 절대 나가지 않는다." },
            { icon: Layers, title: "비대칭은 키 전달용, 대칭은 본 통신용", body: "비대칭 연산은 느려 대량 데이터엔 부담이다. 대칭키 하나를 전달하는 데만 쓰고, 본 통신은 빠른 대칭키가 맡는다." },
            { icon: RefreshCw, title: "대칭키는 세션이 끝나면 폐기된다", body: "핸드셰이크로 만든 대칭키는 그 연결(세션) 동안만 쓰는 임시 키다. 통신이 끝나면 폐기되고, 다음 접속 때는 새 대칭키를 만든다. 매번 새로 만들기 때문에 한 세션의 키가 새어도 다른 세션에 미치는 영향이 제한된다." },
          ],
        },
        {
          kind: "code",
          code: `# 한 번의 생성으로 짝이 되는 두 파일이 동시에 만들어진다 (RSA 예, OpenSSL)
openssl genrsa -out private.key 2048                 # 개인키 (.key / .pem)
openssl rsa -in private.key -pubout -out public.key  # 공개키 (.pub / .pem)

# 공개키로 암호화 → 개인키로만 복호화  (개인키로 서명 → 공개키로 검증, 반대도 성립)`,
        },
        { kind: "mermaid", chart: koHandshake },
      ],
    },
    {
      label: "HASH vs ENC — 해시 vs 암호화",
      title: "복호화가 되느냐가 핵심 차이다",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "암호화는 양방향이다. 키로 잠갔다가 키로 다시 열어 원본을 읽는다. 목적은 기밀성 — 남이 못 보게 숨기는 것.",
            "해시는 단방향이다. 한번 변환하면 원본으로 되돌릴 수 없다. 목적은 무결성 — 데이터가 바뀌었는지 확인하는 것.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: Scale, title: "복호화 가능 여부", body: "암호화는 키가 있으면 원본으로 되돌린다. 해시는 수학적으로 원본 복원이 불가능하다." },
            { icon: Hash, title: "결과 길이", body: "암호문은 원본이 길수록 길어진다. 해시는 입력이 한 글자든 1GB든 항상 고정 길이로 나온다." },
            { icon: Fingerprint, title: "눈사태 효과", body: "입력이 1비트만 바뀌어도 해시 결과 전체가 완전히 달라진다. 그래서 '지문'처럼 위·변조 검사에 쓴다." },
          ],
        },
        {
          kind: "list",
          icon: ListChecks,
          tone: "muted",
          items: [
            "기밀성이 필요하면 암호화 — 대칭(AES), 비대칭(RSA).",
            "무결성·위조 검사가 필요하면 해시 — SHA-256, bcrypt.",
          ],
        },
      ],
    },
    {
      label: "JWT · HMAC",
      title: "비밀키를 섞어 위조를 막는다",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "JWT는 header.payload.signature 세 부분이다. header와 payload는 암호화가 아니라 Base64URL 인코딩일 뿐이라 누구나 열어본다. 위·변조를 막는 건 맨 뒤의 서명(signature)이다.",
            "서명은 HMAC으로 만든다. HMAC은 '해시 + 서버만 아는 비밀키'다. 그냥 SHA-256만 쓰면 공격자가 payload를 바꾼 뒤 해시도 다시 계산해 붙일 수 있지만, 비밀키를 섞으면 비밀키 없는 공격자는 서명을 만들 수 없다.",
          ],
        },
        { kind: "code", code: koJwt },
        {
          kind: "steps",
          steps: [
            { title: "발급 (서버 → 클라이언트)", body: "header와 payload를 서버만 아는 secret과 함께 HMAC-SHA256으로 해싱해 signature를 만든다. header.payload.signature를 클라이언트에 준다." },
            { title: "보관·재전송 (클라이언트 → 서버)", body: "클라이언트는 secret을 모른다. 받은 토큰을 저장했다가 요청마다 그대로 다시 보낸다." },
            { title: "검증 (서버 내부)", body: "받은 header·payload에 서버 자신의 secret을 다시 섞어 해싱하고, 그 값이 토큰의 signature와 같으면 변조되지 않은 것으로 통과시킨다." },
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: ShieldCheck, title: "검증 주체는 서버다", body: "검증은 클라이언트가 아니라, 토큰을 돌려받은 서버가 한다. secret을 클라이언트에 주면 스스로 권한을 admin으로 바꾼 토큰을 위조할 수 있다." },
            { icon: EyeOff, title: "payload는 공개다", body: "Base64URL은 인코딩이지 암호화가 아니다. 비밀번호 같은 민감정보를 payload에 평문으로 넣으면 안 된다." },
          ],
        },
      ],
    },
    {
      label: "PASSWORD — bcrypt · 솔트 · 키 스트레칭",
      title: "비밀번호를 SHA-256으로 저장하면 안 되는 이유",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "SHA-256은 대용량 데이터의 위·변조를 빠르게 검사하려고 설계된 함수라 연산이 매우 빠르다. 역설적으로 이 속도가 비밀번호 저장에서는 공격자에게 유리한 약점이 된다. 알고리즘이 뚫렸다는 뜻이 아니라, '너무 빠르다'는 특성 자체가 문제다.",
          ],
        },
        {
          kind: "list",
          icon: AlertTriangle,
          tone: "destructive",
          items: [
            "무차별 대입: GPU로 초당 수십억 번씩 후보를 해싱해 유출된 해시와 대조한다. 영문+숫자 8자리 정도는 짧은 시간에 역추적된다.",
            "레인보우 테이블: 흔한 비밀번호의 해시를 미리 계산해 두면 검색 한 번으로 원본을 찾는다. 같은 비밀번호는 같은 해시로 저장되므로, 한 명이 뚫리면 같은 비밀번호를 쓴 전원이 함께 노출된다.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: Fingerprint, title: "솔트 (salt)", body: "사용자마다 랜덤값을 붙여 해싱한다. 같은 비밀번호라도 솔트가 달라 DB에는 전혀 다른 해시로 저장된다 — 레인보우 테이블이 무력화된다." },
            { icon: Lock, title: "키 스트레칭", body: "해싱을 수천~수만 번 반복한다. 로그인 1회는 0.1초라 체감이 없지만, 수억 번 대입해야 하는 공격자에겐 연산 시간이 비현실적으로 늘어난다." },
            { icon: ShieldCheck, title: "bcrypt / Argon2", body: "이 둘을 내장한 비밀번호 전용 함수다. bcrypt 해시 문자열에는 비용(반복 횟수)과 솔트가 함께 들어 있어, 검증할 때 같은 조건을 그대로 재현한다." },
          ],
        },
        { kind: "code", code: koBcrypt },
        {
          kind: "prose",
          paragraphs: [
            "해시는 SHA-256이든 bcrypt든 복호화가 불가능하다. 공격자가 하는 건 복호화가 아니라, 후보를 같은 함수에 넣어 결과가 일치할 때까지 맞춰 보는 것이다. 그래서 '한 번 넣어 보는 데 걸리는 시간'을 일부러 늘리는 bcrypt가 비밀번호 저장에 맞는다.",
          ],
        },
      ],
    },
    {
      label: "ENCODING vs ENC vs HASH — 셋의 구분",
      title: "인코딩·암호화·해싱은 목적이 다르다",
      blocks: [
        {
          kind: "keypoints",
          items: [
            { icon: Binary, title: "인코딩 (Base64 등)", body: "보안 목적이 없다. 전송·호환을 위해 형태만 바꾼 것이라 규칙만 알면 100% 되돌린다. JWT의 header·payload가 바로 이것이다." },
            { icon: Lock, title: "암호화 (AES, RSA)", body: "키를 가진 사람만 다시 열어 볼 수 있게 잠근다. 목적은 기밀성이다." },
            { icon: Fingerprint, title: "해싱 (SHA-256, bcrypt)", body: "되돌릴 수 없는 지문으로 만들어 위·변조 여부를 확인한다. 목적은 무결성이다." },
          ],
        },
        {
          kind: "list",
          icon: AlertTriangle,
          tone: "destructive",
          items: ["Base64는 암호화가 아니다. 인코딩된 값을 '암호화됐다'고 믿고 민감정보를 담는 것이 가장 흔한 착각이다."],
        },
      ],
    },
    {
      label: "SIGNATURE · CA — 전자서명과 인증서",
      title: "이 공개키가 진짜 그 서버의 것인가",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "하이브리드 핸드셰이크에는 빈틈이 있다. 서버가 보낸 공개키를 중간에서 공격자가 가짜로 바꿔치기하면(중간자 공격), 클라이언트는 공격자의 공개키로 대칭키를 잠가 보내게 된다. 이를 막는 것이 전자서명과 인증서(CA)다.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: Stamp, title: "전자서명 = 해시 + 비대칭키", body: "보내는 쪽이 문서의 해시를 자기 개인키로 서명해 붙인다. 받는 쪽은 공개키로 검증해 '작성자가 맞고 중간에 바뀌지 않았음'을 확인한다. 암호화와 방향이 반대다 — 개인키로 서명하고 공개키로 검증한다." },
            { icon: BadgeCheck, title: "CA (인증기관)", body: "서버의 공개키와 도메인 정보에 CA가 자기 개인키로 서명한 것이 인증서다. 브라우저는 미리 내장된 CA의 공개키로 그 서명을 검증해, 공개키가 진짜 그 도메인의 것인지 보증받는다." },
            { icon: KeyRound, title: "SSL 인증서에는 공개키만 들어간다", body: "SSL/TLS 인증서(.crt)에 담기는 건 공개키뿐이다. 공개키는 게시판이 아니라 인증서에 담겨 접속할 때 전달되고, 개인키는 인증서에 절대 넣지 않는다 — 유출되면 인증서를 즉시 폐기하고 재발급한다." },
          ],
        },
        { kind: "mermaid", chart: koCa },
      ],
    },
    {
      label: "KMS — 키 관리와 봉투 암호화",
      title: "키를 코드에 두지 않는다",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "암호화 알고리즘이 아무리 완벽해도 키가 코드(GitHub 등)에 노출되면 끝이다. KMS(AWS KMS, GCP Cloud KMS)는 암호화 키를 안전하게 생성·보관하고 주기적으로 교체(Key Rotation)해 주는 전용 서비스다. 핵심은 마스터 키가 KMS 밖으로 절대 나오지 않는다는 점이다.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: Layers, title: "봉투 암호화 (Envelope Encryption)", body: "데이터는 '데이터 키(DEK)'로 암호화하고, 그 데이터 키를 다시 KMS의 '마스터 키'로 암호화해 암호문 옆에 함께 저장한다. 복호화할 때만 암호화된 데이터 키를 KMS에 보내 복호화를 요청한다." },
            { icon: Database, title: "왜 이중으로 잠그나", body: "대량 데이터를 KMS로 직접 보내지 않고 작은 키만 오간다. 마스터 키는 노출되지 않고, 키를 교체할 때도 데이터 전체가 아니라 데이터 키만 다시 암호화하면 된다." },
            { icon: RefreshCw, title: "키는 코드에 두지 않는다", body: "소스에 키를 박으면 암호화 자체가 무의미하다. 환경변수·시크릿 매니저·KMS로 분리하고, 마스터 키 교체는 KMS에 맡긴다." },
          ],
        },
        { kind: "mermaid", chart: koEnvelope },
      ],
    },
    {
      label: "OAUTH 2.0 — 권한 위임",
      title: "비밀번호를 넘기지 않고 접근 권한만 준다",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "OAuth 2.0은 '인증'이 아니라 '권한 위임(authorization)' 프로토콜이다. 다루는 질문은 '이 앱이 내 무엇에 접근해도 되는가'이다. 사용자가 자기 비밀번호를 제3자 앱에 넘기지 않고도, 특정 자원에 대한 제한된 접근 권한(토큰)만 내준다.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: UserCheck, title: "자원 소유자 (Resource Owner)", body: "데이터의 주인, 곧 사용자다. 접근을 허락(동의)하는 주체." },
            { icon: Layers, title: "클라이언트 (Client)", body: "접근을 원하는 앱이다. 사용자를 대신해 제한된 권한만 받는다." },
            { icon: ShieldCheck, title: "인가 서버 (Authorization Server)", body: "사용자를 인증하고 토큰을 발급한다. 자원 서버와 같은 서버일 수도 있다." },
            { icon: Server, title: "자원 서버 (Resource Server)", body: "보호된 데이터를 갖고 있다. access token을 검증한 뒤 데이터를 내준다." },
          ],
        },
        {
          kind: "steps",
          steps: [
            { title: "인가 요청", body: "클라이언트가 사용자를 인가 서버로 보내 로그인과 접근 동의를 받는다." },
            { title: "1회용 코드 발급", body: "사용자가 동의하면 인가 서버가 1회용 '인가 코드'와 함께 사용자를 클라이언트로 되돌려 보낸다." },
            { title: "토큰 교환", body: "클라이언트가 그 코드와 자기 자격증명을 토큰 엔드포인트에 보내 access token으로 교환한다. 이 교환은 브라우저가 아닌 뒤채널에서 이뤄진다." },
            { title: "자원 접근", body: "클라이언트가 access token을 자원 서버에 제시하고 데이터를 받는다." },
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: EyeOff, title: "왜 토큰이 아니라 코드를 리다이렉트로 주나", body: "리다이렉트는 브라우저에 노출되는 경로다. 토큰을 직접 싣지 않고 1회용 코드만 싣고, 실제 토큰 교환은 뒤채널에서 한다." },
            { icon: ShieldCheck, title: "PKCE", body: "코드 가로채기를 막는 code_verifier/challenge 쌍이다. 모바일·SPA 같은 공개 클라이언트에 특히 권장되며, 최근에는 사실상 모든 클라이언트에 권장된다. 구형 implicit 방식은 사용을 자제한다." },
            { icon: KeyRound, title: "access token은 보통 bearer 토큰", body: "가진 사람이 곧 권한인 토큰이다. 그래서 수명을 짧게 두고 HTTPS로만 전송한다." },
          ],
        },
        { kind: "mermaid", chart: koOauth },
      ],
    },
    {
      label: "OIDC — 로그인(인증)",
      title: "OAuth 위에 인증(누구인가)을 더한다",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "OAuth 2.0의 access token에는 '무엇을 해도 되는가'만 있고 '누구인가'는 없다. 그래서 OAuth만으로는 로그인한 사용자가 누구인지 알 수 없다. OIDC(OpenID Connect)는 OAuth 2.0 위에 얹는 인증 계층으로, 이 빈칸을 채운다. '구글로 로그인' 같은 소셜 로그인이 바로 OIDC다.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: BadgeCheck, title: "ID Token", body: "OIDC가 추가하는 핵심이다. JWT 형식이며 사용자 신원 클레임(sub 주체, iss 발급자, aud 대상, iat·exp 시각, nonce)을 담는다. 이것으로 '누가 로그인했는지'를 확인한다." },
            { icon: Network, title: "openid 스코프로 켠다", body: "인가 요청의 scope에 openid를 넣으면 OIDC가 동작하고 ID Token이 함께 발급된다. 이름·이메일 같은 프로필은 ID Token이나 UserInfo 엔드포인트에서 가져온다." },
            { icon: ShieldCheck, title: "토큰 역할을 섞지 않는다", body: "ID Token은 '인증(누구)', access token은 'API 접근(무엇)' 용도다. ID Token으로 API를 호출하거나 access token으로 신원을 판단하면 안 된다." },
          ],
        },
        {
          kind: "list",
          icon: Lightbulb,
          tone: "muted",
          items: [
            "OAuth 2.0 = 인가: 이 앱이 무엇을 해도 되나 (access token).",
            "OIDC = 인증: 이 사용자가 누구인가 (ID Token, JWT).",
          ],
        },
      ],
    },
    {
      label: "SUMMARY — 한눈에",
      title: "목적에 따라 고른다",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "기밀성(못 보게 숨기기): 암호화 — 대칭(AES, 대량 데이터), 비대칭(RSA, 키 전달).",
            "무결성·위조 검사: 해시 — SHA-256(서명·파일 검증), HMAC(비밀키를 섞음, JWT), bcrypt·Argon2(비밀번호 저장).",
            "진위 증명: 전자서명 + CA — 개인키로 서명, 공개키로 검증.",
            "키 관리: KMS + 봉투 암호화 — 마스터 키는 KMS 밖으로 안 나가고, 데이터 키만 암호화해 저장.",
            "권한 위임(무엇을 해도 되나): OAuth 2.0 — access token.",
            "로그인·신원(누구인가): OIDC — ID Token(JWT).",
            "전송 포맷(보안 아님): 인코딩(Base64) — 되돌릴 수 있고 누구나 읽는다.",
          ],
        },
      ],
    },
  ],
};

const en: NoteBody = {
  intro:
    "Encryption and auth run through the backend everywhere — login, payments, token checks — yet symmetric, asymmetric, hashing, encoding, signatures, and tokens get mixed up constantly. This is the working set of concepts, from hybrid encryption to digital signatures, key management (KMS), OAuth 2.0, and OIDC, laid out in one flow from basics to depth. (TLS 1.3's key exchange is covered separately.)",
  sections: [
    {
      label: "HYBRID",
      title: "Why use symmetric and asymmetric keys together",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Symmetric encryption (AES) locks and unlocks with one shared key. It's fast, but the hard part is delivering that key to the other side safely.",
            "Asymmetric encryption (RSA) uses a public/private key pair. What the public key locks, only the private key opens, and vice versa. It's slow, but it solves the key-delivery problem.",
            "So you combine them: use the asymmetric keys to deliver just one symmetric key safely, then send the actual data with the fast symmetric key. That's hybrid encryption, and it's the basic structure of HTTPS.",
          ],
        },
        {
          kind: "steps",
          steps: [
            { title: "Send the public key", body: "The server sends its public key to the client. The private key stays on the server and never leaves." },
            { title: "Create and send the symmetric key", body: "The client generates a symmetric key, encrypts it with the server's public key, and sends it." },
            { title: "Decrypt the symmetric key", body: "The server decrypts it with its private key and now holds the same symmetric key." },
            { title: "Talk over the symmetric key", body: "Both sides share one symmetric key. From here, data is encrypted and decrypted with that fast key." },
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: ListChecks, title: "Terminology: private key ≠ secret key", body: "The public key and private key are the asymmetric pair; the secret key is the symmetric key. Many people loosely call the private key a 'secret key', but 'secret key' means the symmetric key — keep the two distinct." },
            { icon: Layers, title: "The key pair is generated together, mathematically", body: "The public and private keys are a mathematical pair, created at once by a single generate command. They're saved as two separate files with different extensions — e.g. the private key as private.key and the public key as public.key (.pem, .pub, etc.)." },
            { icon: KeyRound, title: "Only the opposite key opens what one key locked", body: "Encrypt with the public key and only the private key decrypts; encrypt (sign) with the private key and only the public key opens it. Whatever one key locks, only its paired key unlocks." },
            { icon: EyeOff, title: "The public key is safe to intercept", body: "What the public key locks only the private key opens. So there's no need to hide it, and the server sends the public key — not the private one." },
            { icon: KeyRound, title: "Why the private key must not be sent", body: "If the private key were sent, an attacker who intercepts it could also decrypt or forge the symmetric key. The private key never leaves the server." },
            { icon: Layers, title: "Asymmetric for key delivery, symmetric for the traffic", body: "Asymmetric math is slow and costly for bulk data. It's used only to deliver one symmetric key; the fast symmetric key carries the actual traffic." },
            { icon: RefreshCw, title: "The symmetric key is discarded when the session ends", body: "The symmetric key from the handshake is temporary — used only for that connection (session). When the session ends it's discarded, and a fresh symmetric key is created on the next connection. Because a new one is made each time, a leak of one session's key has limited impact on other sessions." },
          ],
        },
        {
          kind: "code",
          code: `# one command creates the matched pair as two files (RSA example, OpenSSL)
openssl genrsa -out private.key 2048                 # private key (.key / .pem)
openssl rsa -in private.key -pubout -out public.key  # public key  (.pub / .pem)

# encrypt with the public key → only the private key decrypts (and vice versa)`,
        },
        { kind: "mermaid", chart: enHandshake },
      ],
    },
    {
      label: "HASH vs ENC",
      title: "Reversibility is the core difference",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Encryption is two-way. You lock with a key and unlock with a key to read the original back. The goal is confidentiality — keeping others from seeing it.",
            "Hashing is one-way. Once transformed, it can't be turned back into the original. The goal is integrity — checking whether data changed.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: Scale, title: "Reversibility", body: "Encryption returns the original if you have the key. A hash is mathematically impossible to reverse." },
            { icon: Hash, title: "Output length", body: "Ciphertext grows with the input. A hash is always a fixed length, whether the input is one character or a 1 GB file." },
            { icon: Fingerprint, title: "Avalanche effect", body: "Flip one bit of the input and the entire hash changes completely. That's why it works like a 'fingerprint' for tamper checks." },
          ],
        },
        {
          kind: "list",
          icon: ListChecks,
          tone: "muted",
          items: [
            "Need confidentiality → encryption: symmetric (AES), asymmetric (RSA).",
            "Need integrity / tamper checks → hashing: SHA-256, bcrypt.",
          ],
        },
      ],
    },
    {
      label: "JWT · HMAC",
      title: "Mixing in a secret key to block forgery",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "A JWT has three parts: header.payload.signature. The header and payload aren't encrypted — they're just Base64URL-encoded, so anyone can read them. What blocks tampering is the signature at the end.",
            "The signature is built with HMAC, which is 'a hash plus a server-only secret key'. With plain SHA-256 an attacker could alter the payload and recompute the hash; mixing in the secret means an attacker without it can't produce a valid signature.",
          ],
        },
        { kind: "code", code: enJwt },
        {
          kind: "steps",
          steps: [
            { title: "Issue (server → client)", body: "Hash the header and payload together with a server-only secret via HMAC-SHA256 to make the signature, then hand header.payload.signature to the client." },
            { title: "Store and resend (client → server)", body: "The client doesn't know the secret. It stores the token and sends it back unchanged on each request." },
            { title: "Verify (inside the server)", body: "The server re-hashes the received header and payload with its own secret; if the result matches the token's signature, it passes as untampered." },
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: ShieldCheck, title: "The server does the verifying", body: "Verification happens on the server that receives the token back, not on the client. Hand the secret to the client and it could forge a token that sets its own role to admin." },
            { icon: EyeOff, title: "The payload is public", body: "Base64URL is encoding, not encryption. Don't put sensitive data like passwords into the payload in plaintext." },
          ],
        },
      ],
    },
    {
      label: "PASSWORD — bcrypt · salt · key stretching",
      title: "Why you must not store passwords with SHA-256",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "SHA-256 is designed to check large data for tampering quickly, so it's very fast. Paradoxically that speed becomes an advantage for attackers when storing passwords. It doesn't mean the algorithm is broken — the 'too fast' property itself is the problem.",
          ],
        },
        {
          kind: "list",
          icon: AlertTriangle,
          tone: "destructive",
          items: [
            "Brute force: GPUs hash billions of candidates per second and compare them against leaked hashes. A plain 8-character alphanumeric password is reversed in a short time.",
            "Rainbow tables: precompute hashes of common passwords and one lookup finds the original. Since the same password stores as the same hash, one break exposes everyone who used it.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: Fingerprint, title: "Salt", body: "Add a random value per user before hashing. The same password gets a different salt, so it's stored as an entirely different hash — defeating rainbow tables." },
            { icon: Lock, title: "Key stretching", body: "Repeat the hashing thousands to tens of thousands of times. One login takes ~0.1s and feels instant, but for an attacker running billions of attempts the time becomes impractical." },
            { icon: ShieldCheck, title: "bcrypt / Argon2", body: "Password-specific functions with both built in. A bcrypt hash string carries the cost (round count) and salt inside it, so verification reproduces the same conditions." },
          ],
        },
        { kind: "code", code: enBcrypt },
        {
          kind: "prose",
          paragraphs: [
            "Neither SHA-256 nor bcrypt can be decrypted. What an attacker does isn't decryption but feeding candidates through the same function until the output matches. That's why bcrypt — which deliberately makes each attempt slow — is the right fit for storing passwords.",
          ],
        },
      ],
    },
    {
      label: "ENCODING vs ENC vs HASH",
      title: "Encoding, encryption, and hashing serve different goals",
      blocks: [
        {
          kind: "keypoints",
          items: [
            { icon: Binary, title: "Encoding (Base64, etc.)", body: "No security purpose. It only reshapes data for transport or compatibility, fully reversible by anyone who knows the rule. A JWT's header and payload are exactly this." },
            { icon: Lock, title: "Encryption (AES, RSA)", body: "Locks data so only a key holder can open it again. The goal is confidentiality." },
            { icon: Fingerprint, title: "Hashing (SHA-256, bcrypt)", body: "Turns data into an irreversible fingerprint to check for tampering. The goal is integrity." },
          ],
        },
        {
          kind: "list",
          icon: AlertTriangle,
          tone: "destructive",
          items: ["Base64 is not encryption. Trusting an encoded value as 'encrypted' and putting sensitive data in it is the most common mistake."],
        },
      ],
    },
    {
      label: "SIGNATURE · CA",
      title: "Is this public key really the server's?",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "The hybrid handshake has a gap. If an attacker swaps the server's public key for a fake one in transit (a man-in-the-middle attack), the client locks its symmetric key with the attacker's key. Digital signatures and certificates (CAs) close that gap.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: Stamp, title: "Digital signature = hash + asymmetric key", body: "The sender signs the document's hash with their private key and attaches it. The receiver verifies with the public key, confirming the author is genuine and nothing changed. It's the reverse direction of encryption — sign with the private key, verify with the public key." },
            { icon: BadgeCheck, title: "CA (certificate authority)", body: "A certificate is the server's public key and domain, signed by a CA with the CA's private key. The browser verifies that signature with a built-in CA public key, getting assurance that the key really belongs to that domain." },
            { icon: KeyRound, title: "An SSL certificate contains only the public key", body: "An SSL/TLS certificate (.crt) carries the public key only. It's delivered inside the certificate at connect time, not posted on a board, and the private key is never placed in it — if it leaks, the certificate is revoked and reissued at once." },
          ],
        },
        { kind: "mermaid", chart: enCa },
      ],
    },
    {
      label: "KMS",
      title: "Don't keep keys in the code",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "No matter how strong the algorithm is, it's over the moment the key is exposed in the code (on GitHub, etc.). KMS (AWS KMS, GCP Cloud KMS) is a dedicated service that generates, stores, and rotates keys safely. The key point is that the master key never leaves KMS.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: Layers, title: "Envelope encryption", body: "Encrypt the data with a data key (DEK), then encrypt that DEK with the master key in KMS and store it next to the ciphertext. Only at decrypt time do you send the encrypted DEK to KMS to be decrypted." },
            { icon: Database, title: "Why two layers", body: "Bulk data never goes to KMS — only small keys do. The master key stays hidden, and rotating keys re-encrypts just the data keys, not all the data." },
            { icon: RefreshCw, title: "Keys don't live in code", body: "Hardcode a key in source and the encryption is pointless. Split it out into env vars, a secrets manager, or KMS, and leave master-key rotation to KMS." },
          ],
        },
        { kind: "mermaid", chart: enEnvelope },
      ],
    },
    {
      label: "OAUTH 2.0",
      title: "Grant access without handing over the password",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "OAuth 2.0 is an authorization protocol, not authentication. The question it answers is 'what may this app access on my behalf?'. Without handing a password to a third-party app, the user grants only a limited access token to specific resources.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: UserCheck, title: "Resource owner", body: "The owner of the data — the user. The one who grants (consents to) access." },
            { icon: Layers, title: "Client", body: "The app that wants access. It receives only limited permission on the user's behalf." },
            { icon: ShieldCheck, title: "Authorization server", body: "Authenticates the user and issues tokens. It can be the same server as the resource server." },
            { icon: Server, title: "Resource server", body: "Holds the protected data. It validates the access token before returning data." },
          ],
        },
        {
          kind: "steps",
          steps: [
            { title: "Authorization request", body: "The client sends the user to the authorization server to log in and approve access." },
            { title: "Single-use code", body: "On consent, the authorization server returns the user to the client with a single-use authorization code." },
            { title: "Token exchange", body: "The client sends that code plus its own credentials to the token endpoint to exchange for an access token. This exchange happens on a back channel, not in the browser." },
            { title: "Resource access", body: "The client presents the access token to the resource server and gets the data." },
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: EyeOff, title: "Why a code, not a token, in the redirect", body: "The redirect is visible to the browser. It carries only a single-use code rather than the token itself, and the real token exchange happens on the back channel." },
            { icon: ShieldCheck, title: "PKCE", body: "A code_verifier/challenge pair that blocks code interception. It's especially recommended for public clients like mobile apps and SPAs, and lately for essentially all clients. Avoid the older implicit flow." },
            { icon: KeyRound, title: "Access tokens are usually bearer tokens", body: "Whoever holds the token has the permission. So keep its lifetime short and send it only over HTTPS." },
          ],
        },
        { kind: "mermaid", chart: enOauth },
      ],
    },
    {
      label: "OIDC",
      title: "Adding identity (authentication) on top of OAuth",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "An OAuth 2.0 access token says what you may do, not who you are. So OAuth alone can't tell who logged in. OIDC (OpenID Connect) is an authentication layer on top of OAuth 2.0 that fills that gap. Social logins like 'Sign in with Google' are OIDC.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: BadgeCheck, title: "ID Token", body: "The core thing OIDC adds. It's a JWT carrying identity claims (sub = subject, iss = issuer, aud = audience, iat/exp = timestamps, nonce). This is how you confirm who logged in." },
            { icon: Network, title: "Turned on by the openid scope", body: "Include openid in the authorization request's scope and OIDC kicks in, issuing an ID Token alongside. Profile claims like name and email come from the ID Token or the UserInfo endpoint." },
            { icon: ShieldCheck, title: "Don't mix the token roles", body: "The ID Token is for authentication (who), the access token for API access (what). Don't call APIs with an ID Token, or judge identity from an access token." },
          ],
        },
        {
          kind: "list",
          icon: Lightbulb,
          tone: "muted",
          items: [
            "OAuth 2.0 = authorization: what may this app do (access token).",
            "OIDC = authentication: who is this user (ID Token, a JWT).",
          ],
        },
      ],
    },
    {
      label: "SUMMARY",
      title: "Choose by purpose",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "Confidentiality (hide it): encryption — symmetric (AES, bulk data), asymmetric (RSA, key delivery).",
            "Integrity / tamper checks: hashing — SHA-256 (signatures, file checks), HMAC (mixes in a secret, JWT), bcrypt/Argon2 (password storage).",
            "Proof of authenticity: digital signature + CA — sign with the private key, verify with the public key.",
            "Key management: KMS + envelope encryption — the master key never leaves KMS; only data keys are stored encrypted.",
            "Delegated access (what you may do): OAuth 2.0 — access token.",
            "Login / identity (who you are): OIDC — ID Token (JWT).",
            "Transport format (not security): encoding (Base64) — reversible and readable by anyone.",
          ],
        },
      ],
    },
  ],
};

const content: NoteContent = { ko, en };
export default content;
