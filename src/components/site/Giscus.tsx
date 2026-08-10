"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import type { Lang } from "@/lib/i18n";

/**
 * giscus 댓글. 저장소는 이 레포의 GitHub Discussions라 DB가 필요 없다.
 *
 * 값은 전부 giscus.app이 발급한 공개 식별자다(클라이언트 스크립트에 그대로 실려 나가므로
 * 비밀이 아니다). 레포·카테고리를 바꿀 때만 여기를 고치면 된다.
 *
 * giscus.app 기본값과 일부러 다르게 둔 것:
 *   - mapping: pathname → "specific" + term. ko/en 같은 글이 Discussion 하나를 공유한다.
 *   - strict: 0 → 1. term 정확 일치라 비슷한 제목끼리 섞이지 않는다.
 *   - theme: preferred_color_scheme → 사이트 테마 토글(next-themes)에 동기화.
 *   - lang: 고정 ko → 페이지 언어를 따라감.
 */
const REPO = "YHyoyeon/hyoyeon-blog";
const REPO_ID = "R_kgDOTsmlgw";
// Announcement 형식이라 메인테이너와 giscus 앱만 새 토론을 만들 수 있다.
const CATEGORY = "Announcements";
const CATEGORY_ID = "DIC_kwDOTsmlg84DDDSk";

const GISCUS_ORIGIN = "https://giscus.app";

export default function Giscus({ term, lang }: { term: string; lang: Lang }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  // 스크립트 주입. term·lang이 바뀔 때만 다시 만든다(테마는 아래에서 postMessage로 갈아끼움).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.src = `${GISCUS_ORIGIN}/client.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    const attributes: Record<string, string> = {
      "data-repo": REPO,
      "data-repo-id": REPO_ID,
      "data-category": CATEGORY,
      "data-category-id": CATEGORY_ID,
      "data-mapping": "specific",
      "data-term": term,
      "data-strict": "1",
      "data-reactions-enabled": "1",
      "data-emit-metadata": "0",
      "data-input-position": "top",
      "data-theme": theme,
      "data-lang": lang,
      "data-loading": "lazy",
    };
    for (const [key, value] of Object.entries(attributes)) script.setAttribute(key, value);
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
    // theme은 의도적으로 제외 — 테마를 바꿀 때마다 iframe을 다시 만들면 댓글이 깜빡인다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, lang]);

  // 테마 전환은 iframe에 메시지만 보내 반영한다.
  useEffect(() => {
    const iframe = containerRef.current?.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
    iframe?.contentWindow?.postMessage({ giscus: { setConfig: { theme } } }, GISCUS_ORIGIN);
  }, [theme]);

  return <div ref={containerRef} className="mt-10" />;
}
