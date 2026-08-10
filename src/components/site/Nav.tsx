import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { dict, homePath, otherLang, type Lang } from "@/lib/i18n";

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
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
