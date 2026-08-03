"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Siren, KeyRound, Server, CreditCard, Link2, type LucideIcon } from "lucide-react";
import { notes, categoryLabel, type NoteCategory, type NoteMeta } from "@/lib/notes";

const categories = ["전체", ...Object.keys(categoryLabel)] as const;

const categoryStyle: Record<NoteCategory, { chip: string; thumb: string; icon: LucideIcon }> = {
  Incident: { chip: "bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-400", thumb: "bg-red-50 text-red-300 dark:bg-red-950/40 dark:text-red-500", icon: Siren },
  Auth: { chip: "bg-blue-50 text-blue-500 dark:bg-blue-950/50 dark:text-blue-400", thumb: "bg-blue-50 text-blue-300 dark:bg-blue-950/40 dark:text-blue-500", icon: KeyRound },
  Infra: { chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400", thumb: "bg-emerald-50 text-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-500", icon: Server },
  Payments: { chip: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400", thumb: "bg-amber-50 text-amber-300 dark:bg-amber-950/40 dark:text-amber-500", icon: CreditCard },
  Chain: { chip: "bg-violet-50 text-violet-500 dark:bg-violet-950/50 dark:text-violet-400", thumb: "bg-violet-50 text-violet-300 dark:bg-violet-950/40 dark:text-violet-500", icon: Link2 },
};

export function CategoryChip({ category }: { category: NoteCategory }) {
  return (
    <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${categoryStyle[category].chip}`}>
      {categoryLabel[category]}
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

export function NoteRow({ note }: { note: NoteMeta }) {
  return (
    <Link
      href={`/notes/${note.slug}`}
      className="group flex items-center gap-6 rounded-2xl p-4 transition-colors hover:bg-secondary/70 md:gap-8"
    >
      <div className="min-w-0 flex-1">
        <CategoryChip category={note.category} />
        <h2 className="mt-2.5 text-lg font-bold leading-snug transition-colors group-hover:text-accent md:text-xl break-keep">
          {note.title}
        </h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground break-keep">
          {note.description}
        </p>
      </div>
      <CategoryThumb category={note.category} className="hidden h-24 w-32 shrink-0 sm:flex md:h-28 md:w-40" />
    </Link>
  );
}

export default function HomeList({ excludeSlug }: { excludeSlug?: string }) {
  const [category, setCategory] = useState<string>("전체");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = notes.filter((note) => {
    if (note.slug === excludeSlug && category === "전체" && !q) return false;
    if (category !== "전체" && note.category !== category) return false;
    if (q && !`${note.title} ${note.description}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <section className="pb-8">
      <h2 className="mb-6 text-2xl font-bold tracking-tight md:text-3xl">전체 아티클</h2>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="궁금한 글을 검색해 보세요"
          className="w-full rounded-full bg-secondary py-3 pl-11 pr-5 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-2 focus:outline-ring"
        />
      </div>

      {/* Category tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              category === c
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {c === "전체" ? "전체" : categoryLabel[c as NoteCategory]}
          </button>
        ))}
      </div>

      <ul className="-mx-4 flex flex-col gap-1">
        {filtered.map((note) => (
          <li key={note.slug}>
            <NoteRow note={note} />
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-16 text-center text-[15px] text-muted-foreground">
            검색 결과가 없어요. 다른 키워드로 검색해 보세요.
          </li>
        )}
      </ul>
    </section>
  );
}
