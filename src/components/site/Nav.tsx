import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 md:px-8">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          YHyoyeon<span className="text-accent"> Blog</span>
        </Link>

        <nav className="flex items-center gap-2">
          <a
            href="https://yoon-hyoyeon.vercel.app"
            className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-border"
          >
            포트폴리오
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
