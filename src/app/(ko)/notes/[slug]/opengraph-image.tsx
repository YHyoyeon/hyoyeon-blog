import { notFound } from "next/navigation";
import { ogImage, size, contentType } from "@/lib/og";
import { notes, noteTitle } from "@/lib/notes";
import { catLabel } from "@/lib/i18n";

export const alt = "YHyoyeon Blog";
export { size, contentType };

export function generateStaticParams() {
  return notes.map((n) => ({ slug: n.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = notes.find((n) => n.slug === slug);
  if (!note) notFound();
  return ogImage({ title: noteTitle(note, "ko"), tag: catLabel("ko", note.category) });
}
