import Link from "next/link";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import HomeList, { CategoryChip, CategoryThumb } from "@/components/site/HomeList";
import { notes } from "@/lib/notes";

export default function Home() {
  const featured = notes[0];

  return (
    <>
      <Nav />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 md:px-8">
          {/* Featured hero */}
          <Link
            href={`/notes/${featured.slug}`}
            className="group grid items-center gap-8 py-12 md:grid-cols-2 md:gap-12 md:py-20"
          >
            <div>
              <CategoryChip category={featured.category} />
              <h1 className="mt-4 text-3xl font-extrabold leading-[1.25] tracking-tight transition-colors group-hover:text-accent md:text-4xl break-keep">
                {featured.title}
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground break-keep">
                {featured.description}
              </p>
            </div>
            <CategoryThumb
              category={featured.category}
              className="h-52 w-full transition-transform duration-300 group-hover:scale-[1.02] md:h-64"
            />
          </Link>

          <HomeList excludeSlug={featured.slug} />
        </div>
      </main>

      <Footer />
    </>
  );
}
