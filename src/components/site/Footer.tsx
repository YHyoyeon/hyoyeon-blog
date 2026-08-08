import { dict, type Lang } from "@/lib/i18n";

export default function Footer({ lang = "ko" }: { lang?: Lang }) {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-6 py-10 md:px-8">
        <p className="font-display text-sm font-semibold">YHyoyeon Blog</p>
        <p className="ledger-label">
          {dict[lang].footerTagline} · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
