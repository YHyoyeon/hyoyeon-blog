"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { dict, type Lang } from "@/lib/i18n";

/**
 * 다크모드가 클래스 기반(`@custom-variant dark`)이라 어느 아이콘을 보여줄지는 CSS가 정한다.
 * 그래서 하이드레이션 불일치를 피하려고 mounted 상태를 두던 것이 통째로 필요 없다 —
 * 서버·클라이언트가 같은 마크업을 내고, 실제 표시는 <html>의 .dark 클래스가 결정한다.
 */
export default function ThemeToggle({ lang = "ko" }: { lang?: Lang }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label={dict[lang].toggleTheme}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Moon size={16} className="dark:hidden" />
      <Sun size={16} className="hidden dark:block" />
    </button>
  );
}
