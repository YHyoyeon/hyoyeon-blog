import { CheckCircle2, AlertTriangle, Lightbulb, KeyRound, ListChecks, Layers, EyeOff, Network } from "lucide-react";
import type { NoteBody, NoteContent } from "@/lib/note-content";

const koChart = `%% KMS 기반 SSO 시퀀스 다이어그램 (설명용, 실제 흐름 기준)
%% 로그인 -> 토큰 발급 -> 리소스 접근 -> 리프레시

sequenceDiagram
    autonumber
    participant User as 사용자
    participant Browser as 브라우저 (프론트엔드)
    participant Auth as 인증 서버
    participant IdP as 외부 ID 공급자 (예: Firebase)
    participant KMS as KMS (키 관리 서비스)
    participant Cache as 세션/캐시 저장소 (Redis)
    participant DB as 사용자 데이터베이스
    participant Resource as 리소스 서버 (다른 사내 서비스)

    Note over Auth,KMS: 0. 서버 기동 시 1회: 서명키 준비 (KMS는 여기서만 개입)
    Auth->>KMS: 암호화 저장된 서명용 개인키 복호화 요청
    KMS-->>Auth: 복호화된 개인키 반환
    Auth->>Auth: 복호화된 키를 메모리에 캐시\\n(프로세스가 살아있는 동안 재사용, 요청마다 KMS 호출 없음)
    Resource->>Auth: 공개키(검증용) 조회 요청 (부팅 시 + 주기적 갱신)
    Auth-->>Resource: 공개키 응답 (캐시 가능하도록 만료시간 포함)

    Note over User,DB: 1. 로그인 시작 - 위·변조 방지 파라미터 생성 (브라우저)
    User->>Browser: 아이디/비밀번호 입력 후 로그인
    Browser->>Browser: 코드 검증자/코드 챌린지/state 생성 후 임시 보관

    Note over Browser,DB: 2. 1차 로그인 - 자격증명 검증 후 외부 ID 공급자용 토큰 발급
    Browser->>Auth: 아이디/비밀번호 전송
    Auth->>DB: 사용자 조회 + 비밀번호 대조
    alt 검증 성공
        Auth->>IdP: 해당 사용자용 임시 토큰 발급 요청
        IdP-->>Auth: 임시 토큰 반환
        Auth-->>Browser: 임시 토큰 전달 (민감정보 미포함)
    end

    Note over Browser,IdP: 3. 외부 ID 공급자 로그인 - 신원 확인 토큰 획득 (인증 서버 미개입)
    Browser->>IdP: 임시 토큰으로 로그인 후 신원 확인 토큰 요청
    IdP-->>Browser: 신원 확인 토큰 반환

    Note over Browser,DB: 4. 최종 로그인 - 로그인 세션 확정
    Browser->>Auth: 신원 확인 토큰 전달
    Auth->>IdP: 토큰 진위 검증 요청
    IdP-->>Auth: 검증 결과 (사용자 식별 정보 포함)
    Auth->>DB: 내부 사용자 계정과 매핑 조회 + 로그인 이력 기록
    Auth-->>Browser: 로그인 성공 + 암호화 로그인 세션 쿠키 (HttpOnly, Secure)

    Note over Browser,Cache: 5~6. 인가 코드 발급 → 토큰 교환 (PKCE)
    Browser->>Auth: 인가 코드 요청 (코드 챌린지, state, 세션 쿠키)
    Auth->>Cache: 1회용 인가 코드 발급 및 저장 (짧은 유효시간)
    Auth-->>Browser: 인가 코드 + state 반환
    Browser->>Auth: 인가 코드 + 코드 검증자 전송
    Auth->>Auth: 코드 검증자 해시가 코드 챌린지와 일치하는지 검증
    Auth->>Auth: Access/Refresh Token 발급\\n(메모리 서명키로 즉시 서명 - KMS 재호출 없음)
    Auth->>Cache: 발급 토큰을 화이트리스트에 등록 + 정식 세션 저장
    Auth-->>Browser: 정식 세션 식별자 쿠키 (토큰 원문은 미노출)

    Note over Browser,Resource: 7. 리소스 접근 - 세션 기반 SSO, 인증 서버 왕복 없이 로컬 검증
    Browser->>Resource: API 요청 (세션 식별자 쿠키)
    Resource->>Cache: 세션 식별자로 토큰 정보 조회
    Resource->>Resource: Access Token 서명을 로컬 캐시 공개키로 검증
    Resource-->>Browser: 요청한 리소스 응답

    Note over Browser,Cache: 8. Access Token 만료 → 갱신(리프레시)
    Browser->>Auth: 토큰 갱신 요청 (정식 세션 쿠키)
    Auth->>Cache: Refresh Token 화이트리스트 유효성 확인
    alt Refresh Token 유효
        Auth->>Cache: 기존 Refresh Token 폐기 (재사용 차단)
        Auth->>Auth: 새 Access/Refresh Token 발급 (캐시 서명키, KMS 재호출 없음)
        Auth->>Cache: 새 토큰을 화이트리스트 등록 + 세션 갱신
        Auth-->>Browser: 갱신 성공 (새 만료시간, 토큰 원문 미노출)
    end
`;

const enChart = `%% KMS-backed SSO sequence diagram (illustrative, based on the real flow)
%% login -> token issuance -> resource access -> refresh

sequenceDiagram
    autonumber
    participant User as User
    participant Browser as Browser (frontend)
    participant Auth as Auth server
    participant IdP as External identity provider (e.g. Firebase)
    participant KMS as KMS (key management service)
    participant Cache as Session/cache store (Redis)
    participant DB as User database
    participant Resource as Resource server (other internal service)

    Note over Auth,KMS: 0. Once at boot: prepare signing key (KMS is involved only here)
    Auth->>KMS: request decryption of the stored signing private key
    KMS-->>Auth: return decrypted private key
    Auth->>Auth: cache decrypted key in memory\\n(reused while the process lives, no per-request KMS call)
    Resource->>Auth: fetch verification public key (at boot + periodic refresh)
    Auth-->>Resource: public key response (with expiry so it can be cached)

    Note over User,DB: 1. Login start - generate anti-tamper params (browser)
    User->>Browser: enter id/password and log in
    Browser->>Browser: generate code verifier/challenge/state, stash temporarily

    Note over Browser,DB: 2. First login - verify credentials, issue IdP token
    Browser->>Auth: send id/password
    Auth->>DB: look up user + compare password
    alt verification ok
        Auth->>IdP: request a temp token for this user
        IdP-->>Auth: return temp token
        Auth-->>Browser: hand over temp token (no sensitive data)
    end

    Note over Browser,IdP: 3. IdP login - obtain identity token (auth server not involved)
    Browser->>IdP: log in with temp token, request identity token
    IdP-->>Browser: return identity token

    Note over Browser,DB: 4. Final login - confirm the login session
    Browser->>Auth: hand over identity token
    Auth->>IdP: request token authenticity check
    IdP-->>Auth: verification result (with user identifiers)
    Auth->>DB: map to internal account + record login history
    Auth-->>Browser: login success + encrypted session cookie (HttpOnly, Secure)

    Note over Browser,Cache: 5~6. Issue authorization code → exchange for tokens (PKCE)
    Browser->>Auth: request auth code (code challenge, state, session cookie)
    Auth->>Cache: issue and store a one-time auth code (short TTL)
    Auth-->>Browser: return auth code + state
    Browser->>Auth: send auth code + code verifier
    Auth->>Auth: verify hash of code verifier matches the code challenge
    Auth->>Auth: issue Access/Refresh tokens\\n(signed instantly with the in-memory key - no KMS call)
    Auth->>Cache: register issued tokens in the whitelist + store the real session
    Auth-->>Browser: real session-id cookie (token bodies never sent)

    Note over Browser,Resource: 7. Resource access - session-based SSO, local verification, no round trip
    Browser->>Resource: API request (session-id cookie)
    Resource->>Cache: look up token info by session id
    Resource->>Resource: verify Access Token signature with the locally cached public key
    Resource-->>Browser: requested resource response

    Note over Browser,Cache: 8. Access Token expiry → refresh
    Browser->>Auth: refresh request (real session cookie)
    Auth->>Cache: check Refresh Token whitelist validity
    alt Refresh Token valid
        Auth->>Cache: revoke the old Refresh Token (block reuse)
        Auth->>Auth: issue new Access/Refresh tokens (cached key, no KMS call)
        Auth->>Cache: register new tokens in whitelist + refresh session
        Auth-->>Browser: refresh success (new expiry, token bodies still hidden)
    end
`;

const ko: NoteBody = {
  intro: "로그인부터 토큰 발급·리소스 접근·리프레시까지 실제로 구현한 SSO 흐름을 정리했습니다.",
  sections: [
    {
      label: "PURPOSE — 목적",
      title: "왜 다시 설계했나",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "1차 도메인은 같지만 하위 도메인이 다른 여러 사이트(포탈·인증·운영툴 등) 간에도 로그인 세션이 유지되어야 했습니다. 하지만 레거시 DB 구조상 세션 정보를 자유롭게 바꾸기 어려운 제약이 있었습니다. 여기에 기존 인증 방식의 보안 취약점까지 겹쳤습니다. 그래서 AWS KMS로 서명키를 안전하게 관리하면서도 서비스 간 SSO가 매끄럽게 동작하는 인증 아키텍처로 재설계했습니다.",
          ],
        },
      ],
    },
    {
      label: "HOW — 구현 방법",
      title: "동작 흐름",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "서명키 준비 (부팅 시 1회)", body: "암호화 저장된 서명용 개인키를 KMS로 복호화해 메모리에 캐시한다. 리소스 서버들도 부팅 시 공개키를 받아 각자 캐시해둔다." },
            { title: "1차 로그인 (자체 인증)", body: "아이디/비밀번호를 검증한다. 계정 상태와 잠금 여부를 확인한 뒤 외부 ID 공급자용 임시 토큰을 발급한다." },
            { title: "2차 로그인 (외부 ID 공급자)", body: "임시 토큰으로 외부 ID 공급자에 로그인해 신원 확인 토큰을 받는다. 이 단계는 인증 서버가 개입하지 않는다." },
            { title: "로그인 세션 확정", body: "신원 확인 토큰의 진위를 검증하고 내부 계정과 매핑한다. 이후 암호화된 로그인 세션 쿠키를 발급한다." },
            { title: "인가 코드 발급 · 토큰 교환 (PKCE)", body: "코드 챌린지와 검증자로 인가 코드 탈취를 방지한다. 발급된 Access·Refresh Token의 JTI를 화이트리스트에 등록하고, 실제 토큰 값은 Redis 세션 데이터로 저장한다. 브라우저에는 세션 ID만 쿠키로 내려간다." },
            { title: "리소스 접근 (SSO)", body: "다른 서비스는 자기 세션 쿠키(없으면 인증 서버 세션 쿠키)로 Redis에서 세션 데이터를 가져온다. Access Token 서명은 캐시된 공개키로, JTI는 화이트리스트로 검증한다." },
            { title: "토큰 갱신 (리프레시)", body: "Refresh Token 서명과 화이트리스트 유효성을 확인한 뒤 기존 토큰을 폐기한다. 새 토큰 쌍을 발급한다(Rotation)." },
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
            { icon: KeyRound, title: "KMS는 서버 기동 시 딱 한 번만 호출된다", body: "암호화되어 저장된 서명용 개인키를 부팅 시 KMS로 복호화해 메모리에 올려둔다. 이후 모든 토큰 서명은 메모리 상의 키로 즉시 처리하고, 요청마다 KMS를 다시 부르지 않는다." },
            { icon: ListChecks, title: "Access·Refresh Token 모두 화이트리스트로 관리한다", body: "발급할 때 토큰마다 JTI를 Redis에 등록하고, 검증할 때마다 화이트리스트에 있는지 함께 확인한다. 폐기 시에는 화이트리스트에서 지우는 동시에 짧은 TTL의 블랙리스트에 넣어, 폐기 직후 경합 상황에서 방금 무효화된 토큰이 통과하는 걸 막는다." },
            { icon: Layers, title: "로그인은 2단계 구조다", body: "자체 아이디/비밀번호를 먼저 검증한 뒤 외부 ID 공급자(Firebase 등)를 한 단계 거쳐 최종 로그인 세션을 확정한다." },
            { icon: EyeOff, title: "브라우저에는 토큰 원문이 내려가지 않는다", body: "쿠키에는 세션 ID만 담긴다. 실제 Access·Refresh Token은 Redis 세션 데이터에만 있고, 요청마다 세션 ID로 그 안에서 꺼내 쓴다." },
            { icon: Network, title: "세션 쿠키 하나로 여러 서비스가 로그인 상태를 공유한다", body: "다른 서비스는 자기 세션 쿠키가 없으면 인증 서버의 세션 쿠키를 대신 확인한다. 공개키는 JWKS로 캐시해 만료 전 자동 갱신하고, 갱신 URL은 허용된 호스트만 쓰도록 제한해 SSRF를 막는다." },
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
            "KMS 호출이 부팅 시 1회로 끝나 서명 경로에 외부 API 의존성이 없다 — 응답 속도가 빠르고 KMS 호출 비용도 거의 들지 않는다.",
            "Access·Refresh Token 모두 화이트리스트+블랙리스트로 관리해, 폐기 직후 경합 상황까지 고려한 즉시 무효화가 가능하다.",
            "브라우저에는 세션 ID만 내려가 XSS로 쿠키가 털려도 토큰 원문은 노출되지 않는다.",
            "리소스 서버는 인증 서버에 HTTP로 묻지 않고, 캐시된 JWKS 공개키로 서명을 직접 검증한다.",
            "JWKS 갱신 URL을 허용된 호스트·IP로 제한해 SSRF를 방지하고, 프로덕션에서는 HTTPS만 허용한다.",
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
            "세션 조회와 토큰 화이트리스트 확인 모두 Redis를 거친다 — 인증 서버 API 호출만 없을 뿐, 매 요청마다 공유 Redis에 여러 번 왕복한다.",
            "Redis가 단일 장애점이다 — 캐시 장애 시 로그인, 세션 조회, 토큰 갱신이 한꺼번에 막힌다.",
            "Refresh Token 회전(rotation)과 기존 토큰 폐기가 하나의 트랜잭션으로 묶여있지 않다 — 코드에도 TODO로 남아있는 실제 개선 과제다.",
            "JWT 페이로드에 sub·auth_time 같은 표준 클레임이 빠져 있다 — 이 역시 코드에 TODO로 남아있다.",
            "JWKS 갱신이 실패한 채로 캐시가 만료되면 리소스 서버 프로세스가 스스로 종료한다 — 안전한 실패지만 장애 시 영향 범위가 커진다.",
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
            "Refresh Token 회전과 폐기를 하나의 트랜잭션(Redis Lua 스크립트 등)으로 묶어 경합 상황을 원천 차단한다.",
            "JWT 페이로드에 sub·auth_time·at_hash 등 표준 클레임을 채운다.",
            "Redis를 Multi-AZ·Cluster로 이중화해 세션·화이트리스트 스토어의 단일 장애점을 줄인다.",
            "사용자별 활성 토큰 인덱스(이미 존재)를 활용해, 비밀번호 변경 같은 보안 이벤트 시 관리자 조작 없이도 해당 사용자의 모든 세션을 자동으로 강제 만료시킨다.",
          ],
        },
      ],
    },
  ],
};

const en: NoteBody = {
  intro: "The SSO flow as I actually built it — from login through token issuance, resource access, and refresh.",
  sections: [
    {
      label: "PURPOSE",
      title: "Why redesign it",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Login sessions had to persist across several sites that share a top-level domain but differ by subdomain (portal, auth, ops tools, and so on). But the legacy DB layout made it hard to freely change session data, and the existing auth scheme had security weaknesses on top of that. So I redesigned it into an architecture that manages the signing key safely with AWS KMS while still making SSO across services seamless.",
          ],
        },
      ],
    },
    {
      label: "HOW",
      title: "The runtime flow",
      blocks: [
        {
          kind: "steps",
          steps: [
            { title: "Prepare the signing key (once at boot)", body: "The encrypted signing private key is decrypted via KMS and cached in memory. Resource servers also fetch and cache the public key at boot." },
            { title: "First login (own auth)", body: "Verify id/password. After checking account state and lockout, issue a temporary token for the external identity provider." },
            { title: "Second login (external IdP)", body: "Log in to the external IdP with the temp token to get an identity token. The auth server is not involved in this step." },
            { title: "Confirm the login session", body: "Verify the identity token's authenticity and map it to the internal account, then issue an encrypted login-session cookie." },
            { title: "Auth code + token exchange (PKCE)", body: "A code challenge and verifier prevent auth-code theft. The JTIs of the issued Access/Refresh tokens go into a whitelist, the real token values live in Redis session data, and only a session id goes to the browser as a cookie." },
            { title: "Resource access (SSO)", body: "Other services fetch session data from Redis using their own session cookie (or the auth server's session cookie if absent). Access Token signatures are checked with the cached public key, JTIs against the whitelist." },
            { title: "Token refresh", body: "After checking the Refresh Token's signature and whitelist validity, the old token is revoked and a new token pair is issued (rotation)." },
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
            { icon: KeyRound, title: "KMS is called exactly once, at server boot", body: "The encrypted signing private key is decrypted via KMS at boot and loaded into memory. Every token signature afterward is done instantly with the in-memory key — KMS is never called per request." },
            { icon: ListChecks, title: "Both Access and Refresh tokens are whitelist-managed", body: "Each token's JTI is registered in Redis at issuance and checked against the whitelist on every verification. On revocation it's removed from the whitelist and simultaneously placed on a short-TTL blacklist, so a just-invalidated token can't slip through during the race right after revocation." },
            { icon: Layers, title: "Login is a two-stage structure", body: "The user's own id/password is verified first, then one hop through an external identity provider (Firebase, etc.) finalizes the login session." },
            { icon: EyeOff, title: "Token bodies never reach the browser", body: "The cookie holds only a session id. The real Access/Refresh tokens live only in Redis session data and are pulled out by session id on each request." },
            { icon: Network, title: "One session cookie shares login state across services", body: "A service without its own session cookie checks the auth server's session cookie instead. Public keys are cached as JWKS and auto-refreshed before expiry, and the refresh URL is restricted to allowed hosts to prevent SSRF." },
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
            "KMS is called once at boot, so the signing path has no external API dependency — responses are fast and KMS call costs are near zero.",
            "Both Access and Refresh tokens are managed with a whitelist + blacklist, enabling instant invalidation that accounts even for the race right after revocation.",
            "Only a session id goes to the browser, so token bodies aren't exposed even if a cookie is stolen via XSS.",
            "Resource servers don't ask the auth server over HTTP; they verify signatures directly with the cached JWKS public key.",
            "The JWKS refresh URL is restricted to allowed hosts/IPs to prevent SSRF, and only HTTPS is allowed in production.",
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
            "Both session lookup and token whitelist checks go through Redis — only the auth-server API call is gone; every request still makes several round trips to a shared Redis.",
            "Redis is a single point of failure — a cache outage blocks login, session lookup, and token refresh all at once.",
            "Refresh Token rotation and old-token revocation aren't wrapped in one transaction — a real improvement item left as a TODO in the code too.",
            "The JWT payload omits standard claims like sub and auth_time — also left as a TODO in the code.",
            "If JWKS refresh fails and the cache expires, the resource-server process shuts itself down — a safe failure, but with a wide blast radius during an incident.",
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
            "Wrap Refresh Token rotation and revocation in a single transaction (a Redis Lua script, etc.) to eliminate the race entirely.",
            "Fill in standard JWT payload claims like sub, auth_time, and at_hash.",
            "Make Redis highly available (Multi-AZ / Cluster) to reduce the single point of failure in the session/whitelist store.",
            "Use the per-user active-token index (already present) to auto-expire all of a user's sessions on security events like a password change, with no admin action.",
          ],
        },
      ],
    },
  ],
};

const content: NoteContent = { ko, en };
export default content;
