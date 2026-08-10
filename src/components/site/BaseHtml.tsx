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

/**
 * GA4 측정 ID. 없으면 스니펫을 아예 렌더하지 않는다.
 * 클라이언트 HTML에 그대로 실리는 공개 값이라 비밀이 아니다.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

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
      {/* no-head-element 규칙은 Pages Router(next/head)용이다. App Router에선 <head>가 정당하고,
          gtag 인라인 스크립트는 React가 head로 hoist해 주지 않아 여기 두어야 위치가 보장된다. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        {/* 페이지 metadata의 alternates가 루트 것을 덮어쓰기 때문에 피드 링크는 여기에 직접 둔다.
            <head>에 노출돼야 리더·크롤러가 /feed.xml의 존재를 안다. */}
        <link rel="alternate" type="application/rss+xml" title="YHyoyeon Blog" href="/feed.xml" />
        {/* gtag.js. Search Console의 애널리틱스 확인은 스니펫이 <head>에 있어야 인정하므로
            next/script(=body 주입) 대신 여기에 직접 둔다. */}
        {GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
              }}
            />
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
