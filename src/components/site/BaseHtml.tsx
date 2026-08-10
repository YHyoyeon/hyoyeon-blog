import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/app/providers";
import type { Lang } from "@/lib/i18n";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export default function BaseHtml({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        {/* 페이지 metadata의 alternates가 루트 것을 덮어쓰기 때문에 피드 링크는 여기에 직접 둔다.
            <head>에 노출돼야 리더·크롤러가 /feed.xml의 존재를 안다. */}
        <link rel="alternate" type="application/rss+xml" title="YHyoyeon Blog" href="/feed.xml" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
