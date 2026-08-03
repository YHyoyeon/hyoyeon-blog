import type { Metadata } from "next";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  KeyRound,
  ListChecks,
  Layers,
  EyeOff,
  Network,
} from "lucide-react";
import { NoteHeader, NoteSection, KeyPointList, StepList, IconList } from "@/components/notes/NoteLayout";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import NoteNav from "@/components/notes/NoteNav";
import MermaidDiagram from "@/components/notes/MermaidDiagram";

export const metadata: Metadata = { title: "KMS 기반 SSO 인증 구현" };
const sequenceSource = `%% KMS 기반 SSO 시퀀스 다이어그램 (설명용, 실제 흐름 기준)
%% 로그인 -> 토큰 발급 -> 리소스 접근 -> 리프레시
%%
%% 핵심 포인트
%% - KMS는 "토큰을 발급할 때마다" 호출되지 않는다. 서버가 뜰 때 딱 한 번,
%%   암호화되어 저장해둔 서명용 개인키를 KMS로 복호화해서 메모리에 올려두고,
%%   그 이후의 모든 토큰 서명/검증은 그 메모리 상의 키로 즉시 처리한다.
%% - Refresh Token은 "암호화해서 DB에 저장"하는 방식이 아니라, 서명된 토큰 자체를
%%   발급하고 그 토큰의 식별자만 캐시(화이트리스트)에 등록해서 유효성/폐기 여부를
%%   관리하는 방식이다 (탈취 시 즉시 폐기 가능하도록).
%% - 로그인은 자체 아이디/비밀번호 검증 후, 외부 ID 공급자(Firebase 같은 서비스)를
%%   한 단계 거쳐 최종 로그인 세션을 확정하는 2단계 구조다.
%% - 브라우저에는 토큰 원문이 아니라 세션 식별자만 쿠키로 내려가고, 실제 토큰은
%%   서버 쪽 캐시에만 보관된다 (XSS 등으로 쿠키가 털려도 토큰 자체는 노출 안 됨).
%% - 다른 서비스(리소스 서버)는 매 요청마다 인증 서버에 물어보지 않는다. 부팅 시
%%   인증 서버의 공개키를 미리 받아 캐시해두고, 요청마다 로컬에서 서명만 검증한다.

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

    %% ============================================================
    Note over Auth,KMS: 0. 서버 기동 시 1회: 서명키 준비 (KMS는 여기서만 개입)
    %% ============================================================
    Auth->>KMS: 암호화 저장된 서명용 개인키 복호화 요청
    KMS-->>Auth: 복호화된 개인키 반환
    Auth->>Auth: 복호화된 키를 메모리에 캐시\\n(프로세스가 살아있는 동안 재사용, 요청마다 KMS 호출 없음)

    Resource->>Auth: 공개키(검증용) 조회 요청 (부팅 시 + 주기적 갱신)
    Auth->>Auth: 캐시된 개인키에서 공개키 파생
    Auth-->>Resource: 공개키 응답 (캐시 가능하도록 만료시간 포함)
    Resource->>Resource: 공개키를 메모리에 캐시 (만료 전 백그라운드로 자동 갱신)

    %% ============================================================
    Note over User,DB: 1. 로그인 시작 - 위·변조 방지 파라미터 생성 (브라우저)
    %% ============================================================
    User->>Browser: 아이디/비밀번호 입력 후 로그인
    Browser->>Browser: 코드 교환에 쓸 임시 검증값(코드 검증자) 생성
    Browser->>Browser: 검증값을 해시한 값(코드 챌린지) 생성
    Browser->>Browser: 위조 방지용 임의값(state) 생성
    Browser->>Browser: 위 값들을 브라우저 저장소에 임시 보관

    %% ============================================================
    Note over Browser,DB: 2. 1차 로그인 - 자격증명 검증 후 외부 ID 공급자용 토큰 발급
    %% ============================================================
    Browser->>Auth: 아이디/비밀번호 전송
    Auth->>DB: 사용자 조회 (계정 상태 확인용)
    DB-->>Auth: 사용자 정보 (권한, 이메일, 상태 등)
    Auth->>Cache: 계정 이관/잠금 상태 확인
    Cache-->>Auth: 상태 정보
    Auth->>DB: 휴면 계정 여부 확인
    Auth->>DB: 비밀번호 대조 (DB에 저장된 해시와 비교)
    alt 비밀번호 불일치
        Auth->>Cache: 로그인 실패 횟수 증가 (반복 실패 시 일정 시간 잠금)
        Auth-->>Browser: 로그인 실패 응답
    else 검증 성공
        Auth->>Cache: 로그인 실패 횟수 초기화
        Auth->>IdP: 해당 사용자용 임시 토큰 발급 요청
        IdP-->>Auth: 임시 토큰 반환
        Auth-->>Browser: 임시 토큰 전달 (이메일 등 민감정보는 포함하지 않음)
    end

    %% ============================================================
    Note over Browser,IdP: 3. 외부 ID 공급자 로그인 - 신원 확인 토큰 획득 (인증 서버 미개입)
    %% ============================================================
    Browser->>IdP: 임시 토큰으로 로그인
    IdP-->>Browser: 로그인 성공
    Browser->>IdP: 신원 확인 토큰 요청
    IdP-->>Browser: 신원 확인 토큰 반환

    %% ============================================================
    Note over Browser,DB: 4. 최종 로그인 - 로그인 세션 확정
    %% ============================================================
    Browser->>Auth: 신원 확인 토큰 전달
    Auth->>IdP: 토큰 진위 검증 요청
    IdP-->>Auth: 검증 결과 (사용자 식별 정보 포함)
    Auth->>DB: 내부 사용자 계정과 매핑 조회
    DB-->>Auth: 매핑된 사용자 정보
    opt 이용 제한 대상으로 판별된 경우
        Auth->>DB: 계정 상태 초기화/제한 처리
    end
    Auth->>Cache: 계정 상태 재확인 (이관/잠금/휴면 등)
    Auth->>DB: 최근 로그인 시각 갱신, 로그인 이력 기록
    Auth->>Auth: 사용자 정보를 암호화해 로그인 세션 쿠키 생성
    Auth-->>Browser: 로그인 성공 응답 + 암호화된 로그인 세션 쿠키 설정\\n(HttpOnly, Secure 속성 적용)

    %% ============================================================
    Note over Browser,Cache: 5. 인가 코드 발급 (위·변조 방지 파라미터 검증용 준비)
    %% ============================================================
    Browser->>Auth: 인가 코드 요청 (앞서 만든 코드 챌린지, state 포함, 로그인 세션 쿠키 동봉)
    Auth->>Auth: 요청 클라이언트/리다이렉트 주소가 허용된 값인지 확인
    Auth->>Auth: 로그인 세션 쿠키 복호화 → 사용자 식별
    alt 로그인 세션 없음/무효
        Auth-->>Browser: 인증 필요 응답 (로그인 페이지로 유도)
    else 사용자 확인됨
        Auth->>Cache: 코드 교환 시 검증할 임시 정보 저장 (사용자, 클라이언트, 코드 챌린지 등)
        Auth-->>Browser: 임시 세션 식별자 쿠키 설정
        Auth->>Cache: 1회용 인가 코드 발급 및 저장 (짧은 유효시간)
        Auth-->>Browser: 인가 코드 + state 반환
    end

    %% ============================================================
    Note over Browser,Cache: 6. 토큰 교환 - 인가 코드를 실제 토큰으로 교환
    %% ============================================================
    Browser->>Auth: 인가 코드 + 코드 검증자 전송 (임시 세션 식별자 쿠키 동봉)
    Auth->>Cache: 임시 세션 정보 조회
    Cache-->>Auth: 저장해둔 코드 챌린지 등 정보
    Auth->>Auth: 클라이언트/리다이렉트 주소 일치 확인
    Auth->>Auth: 코드 검증자를 해시한 값이 코드 챌린지와 일치하는지 검증
    alt 검증 실패
        Auth-->>Browser: 토큰 발급 거부
    else 검증 성공
        Auth->>Cache: 인가 코드 유효성 확인 후 즉시 폐기 (재사용 방지)
        Auth->>Cache: 사용자 정보 캐시 조회
        alt 캐시에 없음
            Auth->>DB: 사용자 정보 조회
            DB-->>Auth: 사용자 정보
            Auth->>Cache: 사용자 정보 캐시에 저장 (일정 시간 후 만료)
        end
        Auth->>Auth: Access Token / Refresh Token 발급\\n(메모리에 캐시된 서명키로 즉시 서명 - KMS 재호출 없음)
        Auth->>Cache: 발급된 토큰들을 화이트리스트에 등록 (유효성/폐기 관리용)
        Auth->>Auth: ID Token(신원 확인용) 발급
        Auth->>Cache: 실제 토큰들을 정식 세션으로 저장 (임시 세션은 폐기)
        Auth-->>Browser: 정식 세션 식별자 쿠키로 교체\\n토큰 원문은 내려주지 않고, 세션 식별자와 만료시간만 응답
        Browser->>Browser: 브라우저에 임시로 보관했던 검증값들 삭제
    end

    %% ============================================================
    Note over Browser,Resource: 7. 리소스 접근 - 세션 기반 SSO, 인증 서버 왕복 없이 로컬 검증
    %% ============================================================
    Browser->>Resource: API 요청 (세션 식별자 쿠키 포함 - 다른 서비스와 공유되는 로그인 상태)
    Resource->>Cache: 세션 식별자로 세션 정보 조회
    Cache-->>Resource: 세션에 저장된 토큰 정보
    Resource->>Resource: Access Token 서명을 로컬에 캐시된 공개키로 검증\\n(인증 서버로 별도 확인 요청 없음)
    alt 서명 검증 실패 (키가 최근 교체됐을 가능성)
        Resource->>Auth: 최신 공개키 재조회
        Auth-->>Resource: 최신 공개키 응답
        Resource->>Resource: 검증 재시도
    end
    alt 토큰 만료/무효
        Resource-->>Browser: 인증 필요 응답 (재로그인/갱신 유도)
    else 유효
        Resource-->>Browser: 요청한 리소스 응답
    end

    %% ============================================================
    Note over Browser,Cache: 8. Access Token 만료 → 갱신(리프레시)
    %% ============================================================
    Browser->>Auth: 토큰 갱신 요청 (정식 세션 식별자 쿠키 포함)
    Auth->>Auth: 요청 클라이언트/리다이렉트 주소 확인
    Auth->>Cache: 세션 정보 조회
    Cache-->>Auth: 세션에 저장된 Refresh Token 등
    Auth->>Cache: 짧은 시간 내 중복 갱신 요청인지 확인 (과도한 갱신 방지)
    alt 너무 잦은 요청
        Auth-->>Browser: 요청 제한 응답 (잠시 후 재시도 안내)
    else 진행 가능
        Auth->>Auth: Refresh Token 서명 검증 (캐시된 키 기반, 로컬 처리)
        Auth->>Cache: 해당 Refresh Token이 아직 유효한 화이트리스트에 있는지 확인
        alt Refresh Token 무효 (서명 오류/만료/이미 폐기됨)
            Auth-->>Browser: 갱신 실패 응답 (재로그인 필요)
        else Refresh Token 유효
            Auth->>Cache: 사용자 정보 조회 (캐시 우선, 없으면 DB 조회)
            Auth->>Cache: 기존 Refresh Token을 화이트리스트에서 제거하고 즉시 폐기 처리\\n(재사용 시도 차단)
            Auth->>Auth: 새 Access Token / Refresh Token 발급\\n(캐시된 서명키로 즉시 서명 - KMS 재호출 없음)
            Auth->>Cache: 새로 발급한 토큰들을 화이트리스트에 등록
            Auth->>Auth: 새 ID Token 발급
            Auth->>Cache: 세션에 새 토큰들로 갱신 저장 (세션 식별자는 그대로 유지)
            Auth->>Cache: 중복 갱신 방지용 제한 상태 기록
            Auth-->>Browser: 갱신 성공 응답 (새 만료시간 포함, 토큰 원문은 여전히 노출 안 됨)
        end
    end
`;

const highlights = [
  {
    icon: KeyRound,
    title: "KMS는 서버 기동 시 딱 한 번만 호출된다",
    body: "암호화되어 저장된 서명용 개인키를 부팅 시 KMS로 복호화해 메모리에 올려둔다. 이후 모든 토큰 서명은 메모리 상의 키로 즉시 처리하고, 요청마다 KMS를 다시 부르지 않는다.",
  },
  {
    icon: ListChecks,
    title: "Access·Refresh Token 모두 화이트리스트로 관리한다",
    body: "발급할 때 토큰마다 JTI를 Redis에 등록하고, 검증할 때마다 화이트리스트에 있는지 함께 확인한다. 폐기 시에는 화이트리스트에서 지우는 동시에 짧은 TTL의 블랙리스트에 넣어, 폐기 직후 경합 상황에서 방금 무효화된 토큰이 통과하는 걸 막는다.",
  },
  {
    icon: Layers,
    title: "로그인은 2단계 구조다",
    body: "자체 아이디/비밀번호를 먼저 검증한 뒤 외부 ID 공급자(Firebase 등)를 한 단계 거쳐 최종 로그인 세션을 확정한다.",
  },
  {
    icon: EyeOff,
    title: "브라우저에는 토큰 원문이 내려가지 않는다",
    body: "쿠키에는 세션 ID만 담긴다. 실제 Access·Refresh Token은 Redis 세션 데이터에만 있고, 요청마다 세션 ID로 그 안에서 꺼내 쓴다.",
  },
  {
    icon: Network,
    title: "세션 쿠키 하나로 여러 서비스가 로그인 상태를 공유한다",
    body: "다른 서비스는 자기 세션 쿠키가 없으면 인증 서버의 세션 쿠키를 대신 확인한다. 공개키는 JWKS로 캐시해 만료 전 자동 갱신하고, 갱신 URL은 허용된 호스트만 쓰도록 제한해 SSRF를 막는다.",
  },
];

const implementationSteps = [
  {
    title: "서명키 준비 (부팅 시 1회)",
    body: "암호화 저장된 서명용 개인키를 KMS로 복호화해 메모리에 캐시한다. 리소스 서버들도 부팅 시 공개키를 받아 각자 캐시해둔다.",
  },
  {
    title: "1차 로그인 (자체 인증)",
    body: "아이디/비밀번호를 검증한다. 계정 상태와 잠금 여부를 확인한 뒤 외부 ID 공급자용 임시 토큰을 발급한다.",
  },
  {
    title: "2차 로그인 (외부 ID 공급자)",
    body: "임시 토큰으로 외부 ID 공급자에 로그인해 신원 확인 토큰을 받는다. 이 단계는 인증 서버가 개입하지 않는다.",
  },
  {
    title: "로그인 세션 확정",
    body: "신원 확인 토큰의 진위를 검증하고 내부 계정과 매핑한다. 이후 암호화된 로그인 세션 쿠키를 발급한다.",
  },
  {
    title: "인가 코드 발급 · 토큰 교환 (PKCE)",
    body: "코드 챌린지와 검증자로 인가 코드 탈취를 방지한다. 발급된 Access·Refresh Token의 JTI를 화이트리스트에 등록하고, 실제 토큰 값은 Redis 세션 데이터로 저장한다. 브라우저에는 세션 ID만 쿠키로 내려간다.",
  },
  {
    title: "리소스 접근 (SSO)",
    body: "다른 서비스는 자기 세션 쿠키(없으면 인증 서버 세션 쿠키)로 Redis에서 세션 데이터를 가져온다. Access Token 서명은 캐시된 공개키로, JTI는 화이트리스트로 검증한다.",
  },
  {
    title: "토큰 갱신 (리프레시)",
    body: "Refresh Token 서명과 화이트리스트 유효성을 확인한 뒤 기존 토큰을 폐기한다. 새 토큰 쌍을 발급한다(Rotation).",
  },
];

const pros = [
  "KMS 호출이 부팅 시 1회로 끝나 서명 경로에 외부 API 의존성이 없다 — 응답 속도가 빠르고 KMS 호출 비용도 거의 들지 않는다.",
  "Access·Refresh Token 모두 화이트리스트+블랙리스트로 관리해, 폐기 직후 경합 상황까지 고려한 즉시 무효화가 가능하다.",
  "브라우저에는 세션 ID만 내려가 XSS로 쿠키가 털려도 토큰 원문은 노출되지 않는다.",
  "리소스 서버는 인증 서버에 HTTP로 묻지 않고, 캐시된 JWKS 공개키로 서명을 직접 검증한다.",
  "JWKS 갱신 URL을 허용된 호스트·IP로 제한해 SSRF를 방지하고, 프로덕션에서는 HTTPS만 허용한다.",
];

const cons = [
  "세션 조회와 토큰 화이트리스트 확인 모두 Redis를 거친다 — 인증 서버 API 호출만 없을 뿐, 매 요청마다 공유 Redis에 여러 번 왕복한다.",
  "Redis가 단일 장애점이다 — 캐시 장애 시 로그인, 세션 조회, 토큰 갱신이 한꺼번에 막힌다.",
  "Refresh Token 회전(rotation)과 기존 토큰 폐기가 하나의 트랜잭션으로 묶여있지 않다 — 코드에도 TODO로 남아있는 실제 개선 과제다.",
  "JWT 페이로드에 sub·auth_time 같은 표준 클레임이 빠져 있다 — 이 역시 코드에 TODO로 남아있다.",
  "JWKS 갱신이 실패한 채로 캐시가 만료되면 리소스 서버 프로세스가 스스로 종료한다 — 안전한 실패지만 장애 시 영향 범위가 커진다.",
];

const improvements = [
  "Refresh Token 회전과 폐기를 하나의 트랜잭션(Redis Lua 스크립트 등)으로 묶어 경합 상황을 원천 차단한다.",
  "JWT 페이로드에 sub·auth_time·at_hash 등 표준 클레임을 채운다.",
  "Redis를 Multi-AZ·Cluster로 이중화해 세션·화이트리스트 스토어의 단일 장애점을 줄인다.",
  "사용자별 활성 토큰 인덱스(이미 존재)를 활용해, 비밀번호 변경 같은 보안 이벤트 시 관리자 조작 없이도 해당 사용자의 모든 세션을 자동으로 강제 만료시킨다.",
];

export default function SsoKmsSequence() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 md:px-8 py-16 md:py-24">
      <NoteHeader
        title="KMS 기반 SSO 인증 구현"
        intro="로그인부터 토큰 발급·리소스 접근·리프레시까지 실제로 구현한 SSO 흐름을 정리했습니다."
      />

      <NoteSection label="PURPOSE — 목적" title="왜 다시 설계했나">
        <p className="text-sm text-muted-foreground leading-relaxed break-keep">
          1차 도메인은 같지만 하위 도메인이 다른 여러 사이트(포탈·인증·운영툴 등) 간에도 로그인
          세션이 유지되어야 했습니다. 하지만 레거시 DB 구조상 세션 정보를 자유롭게 바꾸기 어려운
          제약이 있었습니다. 여기에 기존 인증 방식의 보안 취약점까지 겹쳤습니다. 그래서 AWS KMS로
          서명키를 안전하게 관리하면서도 서비스 간 SSO가 매끄럽게 동작하는 인증 아키텍처로 재설계했습니다.
        </p>
      </NoteSection>

      <NoteSection label="HOW — 구현 방법" title="동작 흐름">
        <StepList steps={implementationSteps} />
      </NoteSection>

      <NoteSection label="KEY POINTS — 중요한 것" title="핵심 설계 포인트">
        <KeyPointList items={highlights} />
      </NoteSection>

      <NoteSection label="DIAGRAM — 시퀀스" title="시퀀스 다이어그램">
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
          <NoteNav slug="sso-kms-sequence" />
        </div>
      </main>
      <Footer />
    </>
  );
}
