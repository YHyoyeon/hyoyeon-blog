import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notes, noteTitle } from "@/lib/notes";
import { dict, notePath, catLabel, type Lang } from "@/lib/i18n";

export default function NoteNav({ slug, lang = "ko" }: { slug: string; lang?: Lang }) {
  const t = dict[lang];
  const i = notes.findIndex((n) => n.slug === slug);
  if (i === -1) return null;

  const current = notes[i];
  const prev = notes[i - 1];
  const next = notes[i + 1];
  const related = notes
    .filter((n) => n.category === current.category && n.slug !== slug)
    .slice(0, 3);

  return (
    <div className="mt-20">
      {/* prev / next */}
      <div className="grid gap-3 border-t border-border pt-8 sm:grid-cols-2">
        {prev ? (
          <Link
            href={notePath(lang, prev.slug)}
            className="group rounded-lg border border-border p-4 transition-colors hover:border-accent/40"
          >
            <span className="ledger-label flex items-center gap-1">
              <ArrowLeft size={12} /> {t.prev}
            </span>
            <p className="mt-2 text-sm font-medium leading-snug transition-colors group-hover:text-accent break-keep">
              {noteTitle(prev, lang)}
            </p>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={notePath(lang, next.slug)}
            className="group rounded-lg border border-border p-4 text-right transition-colors hover:border-accent/40"
          >
            <span className="ledger-label flex items-center justify-end gap-1">
              {t.next} <ArrowRight size={12} />
            </span>
            <p className="mt-2 text-sm font-medium leading-snug transition-colors group-hover:text-accent break-keep">
              {noteTitle(next, lang)}
            </p>
          </Link>
        )}
      </div>

      {/* related */}
      {related.length > 0 && (
        <div className="mt-10">
          <p className="section-title">{t.relatedIn(catLabel(lang, current.category))}</p>
          <ul className="divide-y divide-border border-y border-border">
            {related.map((n) => (
              <li key={n.slug}>
                <Link
                  href={notePath(lang, n.slug)}
                  className="group flex items-center justify-between gap-4 py-3.5"
                >
                  <span className="text-sm font-medium transition-colors group-hover:text-accent break-keep">
                    {noteTitle(n, lang)}
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-muted-foreground/50 transition-colors group-hover:text-accent" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
