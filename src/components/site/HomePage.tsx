import Link from "next/link";
import { PenLine, Mail } from "lucide-react";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import HomeList, { CategoryChip, CategoryThumb } from "@/components/site/HomeList";
import { notes, noteTitle, noteDesc } from "@/lib/notes";
import {
  notePath,
  homePath,
  guestbookPath,
  otherLang,
  formatDate,
  dict,
  CONTACT_EMAIL,
  type Lang,
} from "@/lib/i18n";
import { homeJsonLd } from "@/lib/seo";

export default function HomePage({ lang }: { lang: Lang }) {
  const featured = notes[0];
  const t = dict[lang];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd(lang)) }}
      />
      <Nav lang={lang} altHref={homePath[otherLang[lang]]} />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 md:px-8">
          {/* Featured hero */}
          <Link
            href={notePath(lang, featured.slug)}
            className="group grid items-center gap-8 py-12 md:grid-cols-2 md:gap-12 md:py-20"
          >
            <div>
              <div className="flex items-center gap-2.5">
                <CategoryChip category={featured.category} lang={lang} />
                <time dateTime={featured.date} className="font-mono text-xs text-muted-foreground">
                  {formatDate(featured.date, lang)}
                </time>
              </div>
              <h1 className="mt-4 text-3xl font-extrabold leading-[1.25] tracking-tight transition-colors group-hover:text-accent md:text-4xl break-keep">
                {noteTitle(featured, lang)}
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground break-keep">
                {noteDesc(featured, lang)}
              </p>
            </div>
            <CategoryThumb
              category={featured.category}
              className="h-52 w-full transition-transform duration-300 group-hover:scale-[1.02] md:h-64"
            />
          </Link>

          <HomeList lang={lang} />

          {/* 방명록·메일 진입점. Nav 링크만으로는 잘 안 눌려서 목록 끝에 한 번 더 둔다. */}
          <section className="mb-16 rounded-2xl bg-secondary/60 px-6 py-8 md:px-10 md:py-10">
            <h2 className="text-xl font-bold tracking-tight md:text-2xl break-keep">
              {t.contactTitle}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground break-keep">
              {t.contactBody}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href={guestbookPath[lang]}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
              >
                <PenLine size={16} />
                {t.guestbookCta}
              </Link>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 rounded-full bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-border"
              >
                <Mail size={16} />
                {t.emailCta}
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer lang={lang} />
    </>
  );
}
