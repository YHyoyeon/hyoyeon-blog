import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  KeyRound,
  Layers,
  ShieldCheck,
  EyeOff,
  Stamp,
  BadgeCheck,
  Network,
  Server,
  UserCheck,
  RefreshCw,
  Siren,
  Ban,
  Database,
} from "lucide-react";
import type { NoteBody, NoteContent } from "@/lib/note-content";

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

const koJwks = `# 1) OIDC 디스커버리 문서에서 jwks_uri를 찾는다
GET https://idp.example.com/.well-known/openid-configuration
{ "issuer": "https://idp.example.com", "jwks_uri": "https://idp.example.com/jwks.json", ... }

# 2) jwks_uri에서 공개키 목록(JWKS)을 받는다
{ "keys": [ { "kid": "abc123", "kty": "RSA", "use": "sig", "n": "...", "e": "AQAB" }, ... ] }

# 3) ID Token 헤더의 kid로 맞는 키를 골라 서명을 검증한다
header: { "alg": "RS256", "kid": "abc123" }`;

const enJwks = `# 1) find jwks_uri in the OIDC discovery document
GET https://idp.example.com/.well-known/openid-configuration
{ "issuer": "https://idp.example.com", "jwks_uri": "https://idp.example.com/jwks.json", ... }

# 2) fetch the public key set (JWKS) from jwks_uri
{ "keys": [ { "kid": "abc123", "kty": "RSA", "use": "sig", "n": "...", "e": "AQAB" }, ... ] }

# 3) pick the key by the ID Token header's kid and verify the signature
header: { "alg": "RS256", "kid": "abc123" }`;

const koSsrf = `sequenceDiagram
    participant H as 공격자
    participant S as 서버 (취약)
    participant M as 내부 자원 / 메타데이터 (169.254.169.254)
    H->>S: 요청 파라미터에 url=http://169.254.169.254/... 주입
    Note over S: 서버가 그 URL로 대신 요청 (서버의 권한·네트워크 위치로)
    S->>M: GET (외부에선 못 가는 내부 자원)
    M-->>S: IAM 임시 자격증명 등 응답
    S-->>H: 응답이 반사되면 자격증명 유출`;

const enSsrf = `sequenceDiagram
    participant H as Attacker
    participant S as Server (vulnerable)
    participant M as Internal / metadata (169.254.169.254)
    H->>S: inject url=http://169.254.169.254/... into a request parameter
    Note over S: the server makes the request for it (with its own trust/network position)
    S->>M: GET (an internal resource unreachable from outside)
    M-->>S: responds with IAM temporary credentials, etc.
    S-->>H: if the response is reflected, the credentials leak`;

const ko: NoteBody = {
  intro:
    "앞 글 '암호화의 단계'에서 다룬 공개키·전자서명 개념 위에서, 로그인과 권한이 어떻게 돌아가는지 정리한다. OAuth 2.0(권한 위임), 왜 OIDC가 따로 생겼는지, 그 검증에 쓰이는 JWKS, 그리고 이 과정에서 생기는 SSRF 취약점까지 다룬다.",
  sections: [
    {
      label: "OAUTH 2.0 — 권한 위임",
      title: "비밀번호를 넘기지 않고 접근 권한만 준다",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "OAuth 2.0은 '인증'이 아니라 '권한 위임(authorization)' 프로토콜이다(RFC 6749). 다루는 질문은 '이 앱이 내 무엇에 접근해도 되는가'이다. 사용자가 자기 비밀번호를 제3자 앱에 넘기지 않고도, 특정 자원에 대한 제한된 접근 권한(토큰)만 내준다.",
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
            { icon: ShieldCheck, title: "PKCE", body: "코드 가로채기를 막는 code_verifier/challenge 쌍이다(RFC 7636). 모바일·SPA 같은 공개 클라이언트에 특히 권장되며, 최근에는 사실상 모든 클라이언트에 권장된다. 구형 implicit 방식은 사용을 자제한다." },
            { icon: KeyRound, title: "access token은 보통 bearer 토큰", body: "가진 사람이 곧 권한인 토큰이다. 그래서 수명을 짧게 두고 HTTPS로만 전송한다." },
            { icon: RefreshCw, title: "access token과 refresh token", body: "access token은 수명이 짧고, 만료되면 refresh token으로 새 access token을 재발급받는다. refresh token은 더 오래 살고 민감하므로 안전하게 보관하고 회전(rotation)한다." },
          ],
        },
        { kind: "mermaid", chart: koOauth },
      ],
    },
    {
      label: "WHY OIDC — 왜 OIDC가 생겼나",
      title: "OAuth로 로그인을 흉내 내면 생기는 문제",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "OAuth 2.0의 access token에는 '무엇을 해도 되는가'만 있고 '누구인가'는 없다. 초창기에는 OAuth로 로그인을 흉내 냈다 — access token으로 제공자의 프로필 API를 불러 '이 토큰이 있으니 로그인된 사용자'로 취급하는 식이다. 그런데 표준이 없어 제공자마다 방식이 제각각이었고, 보안 허점도 있었다.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: AlertTriangle, title: "access token은 신원 증명이 아니다", body: "access token은 '자원 접근 권한'일 뿐 '누가'를 담지 않는다. 다른 앱용으로 발급된 토큰을 가져와도 프로필 API는 응답하므로, 토큰만으로 사용자를 단정하면 혼동(토큰 치환)이 생긴다." },
            { icon: Ban, title: "표준 부재", body: "'프로필을 어디서 어떻게 받고, 무엇으로 사용자를 식별하나'가 제공자마다 달라 연동이 제각각이었다." },
            { icon: BadgeCheck, title: "그래서 OIDC", body: "OAuth 2.0 위에 '인증'을 표준화한 얇은 계층이 OIDC(OpenID Connect)다. 누가 로그인했는지를 담은 ID Token과 그 검증 방법을 규격으로 정했다." },
          ],
        },
      ],
    },
    {
      label: "OIDC — 로그인(인증)",
      title: "OAuth 위에 인증(누구인가)을 더한다",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "OIDC는 OAuth 2.0 위에 얹는 인증 계층이다. '구글로 로그인' 같은 소셜 로그인이 바로 OIDC다. 동작은 OAuth의 Authorization Code 흐름을 그대로 쓴다.",
            "인가 요청의 scope에 openid를 넣으면, 토큰 교환 때 access token과 함께 ID Token이 발급된다. 이 ID Token이 진짜 그 제공자(IdP)에서 왔는지는 전자서명으로 검증한다 — IdP가 개인키로 서명하고, 클라이언트가 공개키로 검증한다.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: BadgeCheck, title: "ID Token", body: "OIDC가 추가하는 핵심이다. JWT 형식이며 사용자 신원 클레임(sub 주체, iss 발급자, aud 대상, iat·exp 시각, nonce)을 담는다. 이것으로 '누가 로그인했는지'를 확인한다." },
            { icon: Stamp, title: "서명 검증은 전자서명 그대로다", body: "IdP가 자기 개인키로 ID Token에 서명하고, 검증용 공개키는 공개된 주소(JWKS)에 올려둔다. 클라이언트는 그 공개키로 서명을 검증해 'IdP가 발급했고 변조되지 않았음'을 확인한다 — 개인키는 IdP만 갖고 있어 위조할 수 없다." },
            { icon: Network, title: "openid 스코프로 켠다", body: "인가 요청의 scope에 openid를 넣으면 OIDC가 동작하고 ID Token이 함께 발급된다. 이름·이메일 같은 프로필은 ID Token이나 UserInfo 엔드포인트에서 가져온다." },
            { icon: ShieldCheck, title: "토큰 역할을 섞지 않는다", body: "ID Token은 '인증(누구)', access token은 'API 접근(무엇)' 용도다. ID Token으로 API를 호출하거나 access token으로 신원을 판단하면 안 된다." },
          ],
        },
        {
          kind: "steps",
          steps: [
            { title: "서명 발급", body: "로그인 성공 후 IdP가 사용자 신원 클레임을 담은 ID Token을 만들고, 자기 개인키로 서명해 발급한다." },
            { title: "공개키 공개 (JWKS)", body: "IdP는 검증용 공개키를 공개된 JWKS 주소에 게시한다. 클라이언트는 이를 받아 캐시해 둔다." },
            { title: "서명 검증", body: "클라이언트가 JWKS 공개키로 ID Token의 서명을 검증한다. 통과하면 변조되지 않았고 그 IdP가 발급한 것이다." },
            { title: "클레임 검증", body: "iss(발급자가 기대한 IdP인가), aud(내 클라이언트용인가), exp(만료 안 됐나), nonce(내가 보낸 값과 같나)를 확인한다." },
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
      label: "JWKS — 공개키를 어떻게 받나",
      title: "검증용 공개키를 배포하고 교체하는 표준",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "ID Token은 IdP의 개인키로 서명된다. 검증하려면 IdP의 공개키가 필요한데, 그 공개키를 코드에 박아 두면 키를 교체할 때마다 배포를 다시 해야 한다. 그 문제를 푸는 표준이 JWKS(JSON Web Key Set, RFC 7517)다.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: Network, title: "JWKS 엔드포인트", body: "IdP가 검증용 공개키 목록을 JSON으로 게시하는 주소다. 보통 OIDC 디스커버리 문서(/.well-known/openid-configuration)의 jwks_uri로 그 주소를 찾는다." },
            { icon: KeyRound, title: "kid로 키를 고른다", body: "JWT 헤더의 kid(key id)로 JWKS의 어느 키로 검증할지 고른다. 키가 여러 개이거나 교체 중이어도 맞는 키를 집어낸다." },
            { icon: RefreshCw, title: "키 교체(rotation)에 대응", body: "IdP가 키를 주기적으로 바꿔도, 클라이언트는 JWKS를 다시 받아 새 키로 검증한다. 공개키를 코드에 고정하지 않아도 된다." },
          ],
        },
        { kind: "code", code: koJwks },
      ],
    },
    {
      label: "SSRF — 가져올 때의 함정",
      title: "서버가 URL을 받아 요청하면 생기는 취약점",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "JWKS나 OIDC 디스커버리는 '서버가 URL을 받아 그 주소로 요청을 보내는' 동작이다. 이 목적지 URL을 공격자가 조종할 수 있으면 SSRF(Server-Side Request Forgery)가 된다 — 서버가 공격자가 지정한 곳으로 대신 요청을 보내게 만드는 공격이다(OWASP Top 10).",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: Siren, title: "무엇인가", body: "서버가 의도치 않은 목적지로 요청을 보내도록 유도하는 공격이다. 요청이 '서버의 권한·네트워크 위치'로 나가기 때문에, 외부에서 직접 못 가는 내부 자원에 서버를 통해 접근하게 된다." },
            { icon: Database, title: "대표 공격 — 클라우드 메타데이터", body: "서버를 169.254.169.254(클라우드 인스턴스 메타데이터) 같은 내부 주소로 향하게 해 EC2 IAM 임시 자격증명을 빼낸다. 2019년 Capital One 유출이 이 방식의 대표 사례다. localhost·사설망 스캔에도 쓰인다." },
            { icon: EyeOff, title: "블라인드 SSRF", body: "응답이 공격자에게 돌아오지 않아도, 요청이 실제로 나갔는지를 지연·외부 콜백 같은 간접 신호로 확인하는 변형이다." },
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: ShieldCheck, title: "허용 목록(allowlist)", body: "가져올 수 있는 호스트·URL을 화이트리스트로 못 박는다. 블랙리스트는 우회가 쉬워 약하다." },
            { icon: Ban, title: "스킴·내부 IP 차단", body: "http(s)만 허용하고 localhost·사설망·링크로컬(169.254.0.0/16)을 차단한다. 프로덕션에서는 HTTPS만 허용한다." },
            { icon: Layers, title: "egress 제한", body: "서버의 아웃바운드 네트워크 자체를 제한해, 설령 URL이 조작돼도 내부·메타데이터로 나가지 못하게 한다." },
          ],
        },
        {
          kind: "list",
          icon: Lightbulb,
          tone: "muted",
          items: [
            "OIDC에서는 iss·jwks_uri를 신뢰할 수 있는 고정 IdP로만 받고, JWKS를 가져오는 호스트를 허용 목록으로 제한하면 이 경로의 SSRF를 막는다.",
            "AWS 메타데이터는 토큰이 필요한 IMDSv2로 바꾸면, 단순 GET 기반 SSRF로는 자격증명을 빼내기 어려워진다.",
          ],
        },
        { kind: "mermaid", chart: koSsrf },
      ],
    },
    {
      label: "SUMMARY — 한눈에",
      title: "인가·인증·키 배포·그 취약점",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "OAuth 2.0 = 권한 위임(무엇을 해도 되나). 핵심은 Authorization Code 흐름 + PKCE, access token은 bearer.",
            "OIDC = OAuth 위의 인증(누구인가). ID Token(JWT)을 발급하고 공개키로 서명을 검증한다.",
            "JWKS = 검증용 공개키를 배포·교체하는 표준. kid로 키를 고르고, 키 교체에도 대응한다.",
            "SSRF = 서버가 URL을 받아 요청할 때의 취약점. 메타데이터·내부망 접근을 허용 목록·egress 제한으로 막는다.",
          ],
        },
        {
          kind: "link",
          href: "/notes/encryption-fundamentals",
          label: "← 1편: 암호화의 단계 — 핸드셰이크부터 전자서명까지",
        },
      ],
    },
  ],
};

const en: NoteBody = {
  intro:
    "Building on the public-key and digital-signature ideas from the previous post, 'Encryption, Step by Step', this one covers how login and authorization actually work: OAuth 2.0 (delegated access), why OIDC emerged separately, the JWKS used to verify it, and the SSRF vulnerability that shows up along the way.",
  sections: [
    {
      label: "OAUTH 2.0",
      title: "Grant access without handing over the password",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "OAuth 2.0 is an authorization protocol, not authentication (RFC 6749). The question it answers is 'what may this app access on my behalf?'. Without handing a password to a third-party app, the user grants only a limited access token to specific resources.",
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
            { icon: ShieldCheck, title: "PKCE", body: "A code_verifier/challenge pair that blocks code interception (RFC 7636). It's especially recommended for public clients like mobile apps and SPAs, and lately for essentially all clients. Avoid the older implicit flow." },
            { icon: KeyRound, title: "Access tokens are usually bearer tokens", body: "Whoever holds the token has the permission. So keep its lifetime short and send it only over HTTPS." },
            { icon: RefreshCw, title: "Access token and refresh token", body: "The access token is short-lived; when it expires, a refresh token gets a new one. The refresh token lives longer and is more sensitive, so store it safely and rotate it." },
          ],
        },
        { kind: "mermaid", chart: enOauth },
      ],
    },
    {
      label: "WHY OIDC",
      title: "The problem with faking login on top of OAuth",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "An OAuth 2.0 access token says what you may do, not who you are. Early on, people faked login with OAuth — call the provider's profile API with the access token and treat 'has a token' as 'logged-in user'. But with no standard, every provider did it differently, and there were security holes.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: AlertTriangle, title: "An access token is not proof of identity", body: "An access token is a grant to access resources, not a statement of 'who'. A token issued for a different app still works against the profile API, so judging the user from the token alone invites confusion (token substitution)." },
            { icon: Ban, title: "No standard", body: "'Where and how do I fetch the profile, and what identifies the user' differed per provider, so integrations were inconsistent." },
            { icon: BadgeCheck, title: "Hence OIDC", body: "OIDC (OpenID Connect) is a thin layer that standardizes authentication on top of OAuth 2.0. It defines the ID Token that says who logged in, and how to verify it." },
          ],
        },
      ],
    },
    {
      label: "OIDC",
      title: "Adding identity (authentication) on top of OAuth",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "OIDC is an authentication layer on top of OAuth 2.0. Social logins like 'Sign in with Google' are OIDC. It runs on OAuth's Authorization Code flow.",
            "Put openid in the request's scope and the token exchange returns an ID Token alongside the access token. Whether that ID Token really came from the provider (IdP) is checked by its digital signature — the IdP signs with its private key, and the client verifies with the public key.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: BadgeCheck, title: "ID Token", body: "The core thing OIDC adds. It's a JWT carrying identity claims (sub = subject, iss = issuer, aud = audience, iat/exp = timestamps, nonce). This is how you confirm who logged in." },
            { icon: Stamp, title: "Verification is just a digital signature", body: "The IdP signs the ID Token with its private key and publishes the verification public key at a well-known address (JWKS). The client verifies the signature with that public key to confirm the IdP issued it and nothing was tampered with — only the IdP holds the private key, so it can't be forged." },
            { icon: Network, title: "Turned on by the openid scope", body: "Include openid in the authorization request's scope and OIDC kicks in, issuing an ID Token alongside. Profile claims like name and email come from the ID Token or the UserInfo endpoint." },
            { icon: ShieldCheck, title: "Don't mix the token roles", body: "The ID Token is for authentication (who), the access token for API access (what). Don't call APIs with an ID Token, or judge identity from an access token." },
          ],
        },
        {
          kind: "steps",
          steps: [
            { title: "Sign and issue", body: "After login, the IdP builds an ID Token with the user's identity claims and signs it with its private key." },
            { title: "Publish the public key (JWKS)", body: "The IdP publishes the verification public key at a well-known JWKS address. The client fetches and caches it." },
            { title: "Verify the signature", body: "The client verifies the ID Token's signature with the JWKS public key. If it passes, the token is untampered and was issued by that IdP." },
            { title: "Check the claims", body: "Check iss (the expected issuer), aud (meant for this client), exp (not expired), and nonce (matches what the client sent)." },
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
      label: "JWKS",
      title: "A standard for distributing and rotating verification keys",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "An ID Token is signed with the IdP's private key. To verify it you need the IdP's public key — and hardcoding that key means redeploying every time it rotates. JWKS (JSON Web Key Set, RFC 7517) is the standard that solves this.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: Network, title: "The JWKS endpoint", body: "An address where the IdP publishes its verification public keys as JSON. You usually find that address in the jwks_uri of the OIDC discovery document (/.well-known/openid-configuration)." },
            { icon: KeyRound, title: "Pick the key by kid", body: "The JWT header's kid (key id) selects which JWKS key to verify with. Even with multiple keys or a rotation in progress, it picks the right one." },
            { icon: RefreshCw, title: "Handles key rotation", body: "When the IdP rotates keys, the client just refetches the JWKS and verifies with the new key — no need to pin the public key in code." },
          ],
        },
        { kind: "code", code: enJwks },
      ],
    },
    {
      label: "SSRF",
      title: "The trap when a server fetches a URL for you",
      blocks: [
        {
          kind: "prose",
          paragraphs: [
            "Fetching JWKS or the OIDC discovery doc means 'the server takes a URL and makes a request to it'. If an attacker can control that destination URL, it becomes SSRF (Server-Side Request Forgery) — tricking the server into making requests to a place the attacker chose (OWASP Top 10).",
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: Siren, title: "What it is", body: "An attack that induces the server to send a request to an unintended destination. Because the request goes out with the server's own trust and network position, the server reaches internal resources that can't be reached from outside." },
            { icon: Database, title: "Classic attack — cloud metadata", body: "Point the server at an internal address like 169.254.169.254 (cloud instance metadata) to steal EC2 IAM temporary credentials. The 2019 Capital One breach is the well-known example. It's also used to scan localhost and private networks." },
            { icon: EyeOff, title: "Blind SSRF", body: "A variant where no response comes back to the attacker, so they confirm the request fired through indirect signals like timing or an out-of-band callback." },
          ],
        },
        {
          kind: "keypoints",
          items: [
            { icon: ShieldCheck, title: "Allowlist", body: "Pin the hosts/URLs that may be fetched to a whitelist. Blacklists are weak — easy to bypass." },
            { icon: Ban, title: "Block schemes and internal IPs", body: "Allow only http(s), and block localhost, private ranges, and link-local (169.254.0.0/16). In production, allow HTTPS only." },
            { icon: Layers, title: "Restrict egress", body: "Limit the server's outbound network itself, so even a tampered URL can't reach internal or metadata endpoints." },
          ],
        },
        {
          kind: "list",
          icon: Lightbulb,
          tone: "muted",
          items: [
            "In OIDC, accept iss and jwks_uri only from trusted, fixed IdPs and allowlist the hosts you fetch JWKS from — that closes the SSRF on this path.",
            "Switching AWS metadata to IMDSv2 (which requires a session token) makes it much harder for a simple GET-based SSRF to pull credentials.",
          ],
        },
        { kind: "mermaid", chart: enSsrf },
      ],
    },
    {
      label: "SUMMARY",
      title: "Authorization, authentication, key distribution, and its vulnerability",
      blocks: [
        {
          kind: "list",
          icon: CheckCircle2,
          tone: "accent",
          items: [
            "OAuth 2.0 = delegated access (what may you do). The core is the Authorization Code flow + PKCE, with bearer access tokens.",
            "OIDC = authentication on top of OAuth (who you are). It issues an ID Token (JWT) and verifies the signature with a public key.",
            "JWKS = the standard for distributing and rotating verification keys. Pick the key by kid; handle rotation.",
            "SSRF = the vulnerability when a server fetches a URL for you. Block metadata/internal access with allowlists and egress limits.",
          ],
        },
        {
          kind: "link",
          href: "/en/notes/encryption-fundamentals",
          label: "← Part 1: Encryption, Step by Step — From Handshake to Signatures",
        },
      ],
    },
  ],
};

const content: NoteContent = { ko, en };
export default content;
