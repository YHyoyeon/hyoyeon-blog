"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Siren, KeyRound, Server, CreditCard, Link2, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { notes, noteTitle, noteDesc, type NoteCategory, type NoteMeta } from "@/lib/notes";
import { dict, catLabel, notePath, formatDate, type Lang } from "@/lib/i18n";

const categoryKeys: NoteCategory[] = ["Incident", "Auth", "Infra", "Payments", "Chain"];

const categoryStyle: Record<NoteCategory, { chip: string; thumb: string; icon: LucideIcon }> = {
  Incident: { chip: "bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-400", thumb: "bg-red-50 text-red-300 dark:bg-red-950/40 dark:text-red-500", icon: Siren },
  Auth: { chip: "bg-blue-50 text-blue-500 dark:bg-blue-950/50 dark:text-blue-400", thumb: "bg-blue-50 text-blue-300 dark:bg-blue-950/40 dark:text-blue-500", icon: KeyRound },
  Infra: { chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400", thumb: "bg-emerald-50 text-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-500", icon: Server },
  Payments: { chip: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400", thumb: "bg-amber-50 text-amber-300 dark:bg-amber-950/40 dark:text-amber-500", icon: CreditCard },
  Chain: { chip: "bg-violet-50 text-violet-500 dark:bg-violet-950/50 dark:text-violet-400", thumb: "bg-violet-50 text-violet-300 dark:bg-violet-950/40 dark:text-violet-500", icon: Link2 },
};

export function CategoryChip({ category, lang }: { category: NoteCategory; lang: Lang }) {
  return (
    <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${categoryStyle[category].chip}`}>
      {catLabel(lang, category)}
    </span>
  );
}

export function CategoryThumb({ category, className }: { category: NoteCategory; className?: string }) {
  const { thumb, icon: Icon } = categoryStyle[category];
  return (
    <div className={`flex items-center justify-center rounded-2xl ${thumb} ${className ?? ""}`}>
      <Icon strokeWidth={1.4} className="h-1/3 w-1/3" />
    </div>
  );
}

export function NoteRow({ note, lang }: { note: NoteMeta; lang: Lang }) {
  return (
    <Link
      href={notePath(lang, note.slug)}
      className="group flex items-center gap-6 rounded-2xl p-4 transition-colors hover:bg-secondary/70 md:gap-8"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <CategoryChip category={note.category} lang={lang} />
          <time dateTime={note.date} className="font-mono text-xs text-muted-foreground">
            {formatDate(note.date, lang)}
          </time>
        </div>
        <h2 className="mt-2.5 text-lg font-bold leading-snug transition-colors group-hover:text-accent md:text-xl break-keep">
          {noteTitle(note, lang)}
        </h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground break-keep">
          {noteDesc(note, lang)}
        </p>
      </div>
      <CategoryThumb category={note.category} className="hidden h-24 w-32 shrink-0 sm:flex md:h-28 md:w-40" />
    </Link>
  );
}

const PAGE_SIZE = 5;
type Filter = NoteCategory | "all";

export default function HomeList({ lang }: { lang: Lang }) {
  const t = dict[lang];
  const [category, setCategory] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const q = query.trim().toLowerCase();
  const filtered = notes.filter((note) => {
    if (category !== "all" && note.category !== category) return false;
    if (q && !`${noteTitle(note, lang)} ${noteDesc(note, lang)}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <section className="pb-8">
      <div className="mb-6 flex items-baseline gap-3">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t.allArticles}</h2>
        <span className="text-sm font-semibold text-muted-foreground">{t.totalCount(filtered.length)}</span>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder={t.searchPlaceholder}
          className="w-full rounded-full bg-secondary py-3 pl-11 pr-5 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-2 focus:outline-ring"
        />
      </div>

      {/* Category tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(["all", ...categoryKeys] as Filter[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setCategory(c);
              setPage(1);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              category === c
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {c === "all" ? t.all : catLabel(lang, c)}
          </button>
        ))}
      </div>

      <ul className="-mx-4 flex flex-col gap-1">
        {paged.map((note) => (
          <li key={note.slug}>
            <NoteRow note={note} lang={lang} />
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-16 text-center text-[15px] text-muted-foreground">
            {t.noResults}
          </li>
        )}
      </ul>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label={lang === "en" ? "Pagination" : "페이지"} className="mt-8 flex items-center justify-center gap-1.5">
          <button
            type="button"
            aria-label={lang === "en" ? "Previous page" : "이전 페이지"}
            disabled={safePage === 1}
            onClick={() => setPage(safePage - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft size={17} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-current={n === safePage ? "page" : undefined}
              onClick={() => setPage(n)}
              className={`h-9 w-9 rounded-full text-sm font-semibold transition-colors ${
                n === safePage
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            aria-label={lang === "en" ? "Next page" : "다음 페이지"}
            disabled={safePage === totalPages}
            onClick={() => setPage(safePage + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight size={17} />
          </button>
        </nav>
      )}
    </section>
  );
}
