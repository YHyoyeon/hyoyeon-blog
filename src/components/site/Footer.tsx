import ViewCounter from "@/components/site/ViewCounter";
import { dict, type Lang } from "@/lib/i18n";

export default function Footer({ lang = "ko" }: { lang?: Lang }) {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-6 py-10 md:px-8">
        <p className="font-display text-sm font-semibold">YHyoyeon Blog</p>
        <p className="ledger-label">
          {dict[lang].footerTagline} · {new Date().getFullYear()}
        </p>
        {/* 모든 페이지에 있으므로 어느 경로로 들어와도 세션당 한 번 집계된다. */}
        <div className="mt-2">
          <ViewCounter slug="site" lang={lang} kind="site" />
        </div>
      </div>
    </footer>
  );
}
