import { notes, noteTitle, noteDesc, SITE_URL } from "@/lib/notes";
import { notePath } from "@/lib/i18n";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function GET() {
  const items = notes
    .map(
      (n) => `    <item>
      <title>${esc(noteTitle(n, "ko"))}</title>
      <link>${SITE_URL}${notePath("ko", n.slug)}</link>
      <guid>${SITE_URL}${notePath("ko", n.slug)}</guid>
      <description>${esc(noteDesc(n, "ko"))}</description>
      <pubDate>${new Date(n.date).toUTCString()}</pubDate>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>YHyoyeon Blog</title>
    <link>${SITE_URL}</link>
    <description>실무에서 해결한 기술 문제들의 기록</description>
    <language>ko</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
