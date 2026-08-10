"use client";

import { useEffect, useState } from "react";
import { Eye, Users } from "lucide-react";
import { dict, type Lang } from "@/lib/i18n";

/**
 * 마운트 시 한 번 POST해서 카운트를 받아 표시한다.
 * 환경변수가 없거나 실패하면 아무것도 렌더하지 않는다 — 조회수 때문에 글이 깨지면 안 된다.
 *
 * 글이든 사이트든 서버가 세션 쿠키로 걸러 세션당 한 번만 올린다. 새로고침해도 숫자가
 * 그대로인 게 정상이고, 개발 모드의 StrictMode 이중 호출도 두 번째는 걸러진다.
 *
 * kind는 표기만 바꾼다 — "1,234회"(글) vs "방문자 1,234명"(사이트).
 */
export default function ViewCounter({
  slug,
  lang,
  kind = "post",
}: {
  slug: string;
  lang: Lang;
  kind?: "post" | "site";
}) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/views/${slug}`, { method: "POST" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { views: number | null } | null) => {
        if (alive) setViews(data?.views ?? null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [slug]);

  if (views === null) return null;

  const Icon = kind === "site" ? Users : Eye;
  const label = kind === "site" ? dict[lang].visitors(views) : dict[lang].views(views);

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[13px] text-muted-foreground">
      <Icon size={14} />
      {label}
    </span>
  );
}
