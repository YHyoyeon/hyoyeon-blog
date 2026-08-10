"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { dict, type Lang } from "@/lib/i18n";

/**
 * 마운트 시 한 번 POST해서 INCR 결과(=새 조회수)를 그대로 표시한다.
 * 환경변수가 없거나 실패하면 아무것도 렌더하지 않는다 — 조회수 때문에 글이 깨지면 안 된다.
 * 개발 모드에서는 StrictMode가 effect를 두 번 돌려 2씩 오른다(운영 빌드는 1).
 */
export default function ViewCounter({ slug, lang }: { slug: string; lang: Lang }) {
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

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[13px] text-muted-foreground">
      <Eye size={14} />
      {dict[lang].views(views)}
    </span>
  );
}
