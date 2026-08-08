import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NotePage from "@/components/notes/NotePage";
import { noteContent } from "@/content/notes";
import { notes, noteTitle, noteDesc } from "@/lib/notes";
import { noteMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(noteContent).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = notes.find((n) => n.slug === slug);
  if (!note) return {};
  return noteMetadata("ko", slug, noteTitle(note, "ko"), noteDesc(note, "ko"));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!noteContent[slug]) notFound();
  return <NotePage slug={slug} lang="ko" />;
}
