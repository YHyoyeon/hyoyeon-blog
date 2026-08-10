import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { dict, homePath, guestbookPath, otherLang, type Lang } from "@/lib/i18n";

export default function Nav({ lang = "ko", altHref }: { lang?: Lang; altHref?: string }) {
  const t = dict[lang];
  const other = otherLang[lang];

  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 md:px-8">
        <Link href={homePath[lang]} className="text-xl font-extrabold tracking-tight">
          YHyoyeon<span className="text-accent"> {t.brandSuffix}</span>
        </Link>

        <nav className="flex items-center gap-2">
          {/* 방명록은 다른 링크와 같은 회색이면 묻힌다. accent 톤으로 눈에 띄게 둔다. */}
          <Link
            href={guestbookPath[lang]}
            className="rounded-full bg-accent/10 px-3.5 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/20"
          >
            {t.guestbook}
          </Link>
          <Link
            href={altHref ?? `${homePath[other]}?lang=${other}`}
            className="rounded-full px-2.5 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
            aria-label={other === "en" ? "Switch to English" : "한국어로 전환"}
          >
            {other.toUpperCase()}
          </Link>
          <a
            href="https://yoon-hyoyeon.vercel.app"
            className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-border"
          >
            {t.portfolio}
          </a>
          <ThemeToggle lang={lang} />
        </nav>
      </div>
    </header>
  );
}
