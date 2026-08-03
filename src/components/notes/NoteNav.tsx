import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notes, categoryLabel } from "@/lib/notes";

export default function NoteNav({ slug }: { slug: string }) {
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
            href={`/notes/${prev.slug}`}
            className="group rounded-lg border border-border p-4 transition-colors hover:border-accent/40"
          >
            <span className="ledger-label flex items-center gap-1">
              <ArrowLeft size={12} /> 이전 글
            </span>
            <p className="mt-2 text-sm font-medium leading-snug transition-colors group-hover:text-accent break-keep">
              {prev.title}
            </p>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/notes/${next.slug}`}
            className="group rounded-lg border border-border p-4 text-right transition-colors hover:border-accent/40"
          >
            <span className="ledger-label flex items-center justify-end gap-1">
              다음 글 <ArrowRight size={12} />
            </span>
            <p className="mt-2 text-sm font-medium leading-snug transition-colors group-hover:text-accent break-keep">
              {next.title}
            </p>
          </Link>
        )}
      </div>

      {/* related */}
      {related.length > 0 && (
        <div className="mt-10">
          <p className="section-title">Related — {categoryLabel[current.category]} 카테고리의 다른 글</p>
          <ul className="divide-y divide-border border-y border-border">
            {related.map((n) => (
              <li key={n.slug}>
                <Link
                  href={`/notes/${n.slug}`}
                  className="group flex items-center justify-between gap-4 py-3.5"
                >
                  <span className="text-sm font-medium transition-colors group-hover:text-accent break-keep">
                    {n.title}
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
