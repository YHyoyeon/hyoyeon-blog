import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import NoteNav from "@/components/notes/NoteNav";
import ViewCounter from "@/components/notes/ViewCounter";
import Giscus from "@/components/site/Giscus";
import MermaidDiagram from "@/components/notes/MermaidDiagram";
import { NoteHeader, NoteSection, KeyPointList, StepList, IconList } from "@/components/notes/NoteLayout";
import { noteContent } from "@/content/notes";
import { notes, noteTitle, noteDesc } from "@/lib/notes";
import { notePath, otherLang, type Lang } from "@/lib/i18n";
import { noteJsonLd } from "@/lib/seo";
import type { Block as BlockData } from "@/lib/note-content";

function Block({ block }: { block: BlockData }) {
  switch (block.kind) {
    case "prose":
      return (
        <>
          {block.paragraphs.map((p, i) => (
            <p
              key={i}
              className={`text-sm text-muted-foreground leading-relaxed break-keep${i > 0 ? " mt-4" : ""}`}
            >
              {p}
            </p>
          ))}
        </>
      );
    case "steps":
      return <StepList steps={block.steps} />;
    case "keypoints":
      return <KeyPointList items={block.items} />;
    case "list":
      return <IconList items={block.items} icon={block.icon} tone={block.tone} />;
    case "mermaid":
      return <MermaidDiagram chart={block.chart} />;
    case "code":
      return (
        <pre className="rounded-lg border border-border bg-secondary/20 p-4 overflow-x-auto text-xs leading-relaxed">
          {block.code}
        </pre>
      );
    case "custom":
      return <>{block.node}</>;
  }
}

export default function NotePage({ slug, lang }: { slug: string; lang: Lang }) {
  const note = notes.find((n) => n.slug === slug);
  const body = noteContent[slug]?.[lang];
  if (!note || !body) return null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            noteJsonLd(lang, slug, noteTitle(note, lang), noteDesc(note, lang), note.date),
          ),
        }}
      />
      <Nav lang={lang} altHref={notePath(otherLang[lang], slug)} />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 md:px-8 py-16 md:py-24">
          <NoteHeader lang={lang} title={noteTitle(note, lang)} intro={body.intro} />
          <div className="mt-4">
            <ViewCounter slug={slug} lang={lang} />
          </div>

          {body.sections.map((section, i) => (
            <NoteSection key={i} label={section.label} title={section.title}>
              {section.blocks.map((block, j) => (
                <Block key={j} block={block} />
              ))}
            </NoteSection>
          ))}

          <NoteNav slug={slug} lang={lang} />
          <Giscus term={slug} lang={lang} />
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
}
