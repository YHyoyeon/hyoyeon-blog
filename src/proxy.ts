import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 언어 분기. ko는 `/`, en은 `/en`에 있고 기본값은 en이다.
 * - `/` 진입: 쿠키 > Accept-Language 순으로 판정해, 한국어가 아니면 `/en`으로 보낸다.
 * - `?lang=` 은 언어 토글의 명시적 선택. 쿠키로 고정한 뒤 파라미터 없는 URL로 되돌린다.
 *   (이게 없으면 `/en`에서 KO를 눌러 `/`로 와도 헤더 판정에 다시 `/en`으로 튕긴다)
 * 글 상세(`/notes/...`)는 일부러 제외한다 — 공유된 링크와 크롤러가 언어를 이미 지정한 URL이라
 * 여기서 리다이렉트하면 한쪽 언어가 색인에서 빠진다.
 */
/**
 * 검색엔진·SNS 크롤러는 리다이렉트 없이 통과시킨다.
 * 봇은 Accept-Language를 안 보내서 전부 `/en`으로 튕기는데, 그러면 크롤러가 ko 버전을
 * 볼 수 없어 색인에서 빠진다(Google도 언어 추정 기반 자동 리다이렉트를 권장하지 않는다).
 * 콘텐츠를 다르게 주는 게 아니라 리다이렉트만 건너뛰는 것이라 클로킹이 아니다.
 */
const CRAWLER = /bot|crawl|spider|slurp|facebookexternalhit|preview|embedly/i;

export function proxy(request: NextRequest) {
  if (CRAWLER.test(request.headers.get("user-agent") ?? "")) return;

  const chosen = request.nextUrl.searchParams.get("lang");
  if (chosen === "ko" || chosen === "en") {
    const response = NextResponse.redirect(new URL(chosen === "ko" ? "/" : "/en", request.url));
    response.cookies.set("lang", chosen, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return response;
  }

  // `/en`은 그 자체로 언어가 명시된 경로라 판정이 필요 없다.
  if (request.nextUrl.pathname !== "/") return;

  const preferred =
    request.cookies.get("lang")?.value ??
    (request.headers.get("accept-language")?.toLowerCase().startsWith("ko") ? "ko" : "en");

  if (preferred === "en") return NextResponse.redirect(new URL("/en", request.url));
}

export const config = { matcher: ["/", "/en"] };
