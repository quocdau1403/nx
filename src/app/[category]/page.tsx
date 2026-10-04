import { notFound } from "next/navigation";
import { AlbumCard } from "@/components/gallery/album-card";
import { CategoryHero } from "@/components/gallery/category-hero";
import { FeaturedAlbum } from "@/components/gallery/featured-album";
import { ContactCta } from "@/components/site/contact-cta";
import { PageTransition } from "@/components/site/page-transition";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { TransitionLink } from "@/components/site/transition-link";
import { listAlbums } from "@/lib/albums";
import { getSession } from "@/lib/auth";
import { CATEGORIES, getCategory, messengerUrl } from "@/lib/categories";
import { hasCoverFile } from "@/lib/covers";

type Props = { params: Promise<{ category: string }> };

const FEATURED = 2;

export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  const found = getCategory(category);
  return { title: found?.title, description: found?.description };
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const session = await getSession();
  const albums = (await listAlbums(slug)).filter((a) => a.count > 0);
  const featured = albums.slice(0, FEATURED);
  const rest = albums.slice(FEATURED);
  const totalPhotos = albums.reduce((sum, a) => sum + a.count, 0);
  const booking = messengerUrl(category);

  return (
    <>
      <SiteHeader user={session} current={slug} bookingUrl={booking} />
      <PageTransition>
      <main>
        <CategoryHero
          category={category}
          hasCover={hasCoverFile(category)}
          albums={albums}
          totalPhotos={totalPhotos}
          bookingUrl={booking}
        />

        {albums.length === 0 && (
          <p className="pb-10 text-center font-display text-2xl text-muted">Album đang được cập nhật.</p>
        )}

        {/* Album nổi bật */}
        {featured.length > 0 && (
          <section id="albums" className="mx-auto max-w-350 scroll-mt-28 space-y-8 px-5 md:px-10">
            {featured.map((album, i) => (
              <FeaturedAlbum
                key={album.id}
                album={album}
                eyebrow={i === 0 ? "Album mới nhất" : "Album nổi bật"}
                description={category.description}
                categoryTitle={category.title}
                reverse={i % 2 === 1}
              />
            ))}
          </section>
        )}

        {/* Tất cả album */}
        {rest.length > 0 && (
          <section className="mx-auto max-w-350 px-5 pt-28 md:px-10">
            <SectionHeading title={`${rest.length} album khác`} italic={`trong bộ sưu tập ${category.title.toLowerCase()}`} />
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {rest.map((album) => (
                <AlbumCard key={album.id} album={album} eyebrow={category.title} />
              ))}
            </div>
          </section>
        )}

        {/* Hạng mục khác */}
        <nav aria-label="Hạng mục khác" className="mx-auto mt-24 flex max-w-350 flex-wrap justify-center gap-3 px-5 md:px-10">
          {CATEGORIES.filter((c) => c.slug !== slug).map((c) => (
            <TransitionLink
              key={c.slug}
              href={`/${c.slug}`}
              type="nav-lateral"
              className="label rounded-full border border-line px-6 py-3.5 text-muted transition-colors hover:border-gold hover:text-gold"
            >
              {c.index} · {c.title} →
            </TransitionLink>
          ))}
        </nav>

        <ContactCta category={category} />
      </main>
      <SiteFooter />
      </PageTransition>
    </>
  );
}
