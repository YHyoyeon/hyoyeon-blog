import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import Giscus from "@/components/site/Giscus";
import { dict, guestbookPath, otherLang, type Lang } from "@/lib/i18n";

export default function GuestbookPage({ lang }: { lang: Lang }) {
  const t = dict[lang];

  return (
    <>
      <Nav lang={lang} altHref={guestbookPath[otherLang[lang]]} />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 md:px-8 py-16 md:py-24">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t.guestbook}</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed break-keep">{t.guestbookIntro}</p>
          {/* ko·en이 같은 term을 쓰므로 방명록은 언어와 무관하게 하나의 Discussion을 공유한다. */}
          <Giscus term="guestbook" lang={lang} />
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
}
