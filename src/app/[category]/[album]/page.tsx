import { notFound } from "next/navigation";
import { ViewTransition } from "@/lib/view-transition";
import { AlbumCard } from "@/components/gallery/album-card";
import { AlbumViewer } from "@/components/gallery/album-viewer";
import { ArrowIcon } from "@/components/site/arrow-icon";
import { ContactCta } from "@/components/site/contact-cta";
import { PageTransition } from "@/components/site/page-transition";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { TransitionLink } from "@/components/site/transition-link";
import { listAlbums } from "@/lib/albums";
import { getSession } from "@/lib/auth";
import { getCategory, messengerUrl } from "@/lib/categories";
import { db } from "@/lib/db";
import { photoViewSelect } from "@/lib/photos";

type Props = { params: Promise<{ category: string; album: string }> };

const RELATED = 3;

async function findAlbum(category: string, slug: string) {
  return db.album.findUnique({
    where: { category_slug: { category, slug } },
    include: { photos: { orderBy: { position: "asc" }, select: photoViewSelect } },
  });
}

export async function generateMetadata({ params }: Props) {
  const { category, album } = await params;
  const found = await db.album.findUnique({ where: { category_slug: { category, slug: album } }, select: { title: true } });
  return { title: found?.title };
}

export default async function AlbumPage({ params }: Props) {
  const { category: categorySlug, album: albumSlug } = await params;
  const category = getCategory(categorySlug);
  if (!category) notFound();

  const session = await getSession();
  const album = await findAlbum(categorySlug, albumSlug);
  if (!album) notFound();

  const related = (await listAlbums(categorySlug)).filter((a) => a.id !== album.id && a.count > 0).slice(0, RELATED);
  const booking = messengerUrl(category);

  return (
    <>
      <SiteHeader user={session} current={category.slug} bookingUrl={booking} />
      <PageTransition>
      <main>
        <section className="mx-auto max-w-350 px-5 pt-10 md:px-10 md:pt-14">
          <nav aria-label="Breadcrumb" className="label flex flex-wrap items-center gap-3 text-muted">
            <TransitionLink href="/" type="nav-back" className="transition-colors hover:text-ink">
              Trang chủ
            </TransitionLink>
            <span aria-hidden>/</span>
            <TransitionLink href={`/${category.slug}`} type="nav-back" className="transition-colors hover:text-ink">
              {category.title}
            </TransitionLink>
            <span aria-hidden>/</span>
            <span aria-current="page" className="text-ink">
              {album.title}
            </span>
          </nav>

          <div className="mt-10 grid gap-8 border-b border-line pb-12 md:grid-cols-[1.4fr_1fr] md:items-end md:pb-16">
            <div>
              <p className="flex items-center gap-4">
                <span className="label text-gold">
                  {category.index} · {category.eyebrow}
                </span>
                <span aria-hidden className="h-px w-10 bg-ink/25" />
              </p>
              <h1 className="caps-display mt-6 text-4xl md:text-6xl lg:text-7xl">
                <ViewTransition name={`album-title-${album.id}`} share="text-morph" default="none">
                  <span>{album.title}</span>
                </ViewTransition>
              </h1>
            </div>
            <div className="md:justify-self-end md:text-right">
              <p className="max-w-sm text-sm leading-relaxed text-muted md:ml-auto">
                {album.description ?? category.description}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-6 md:justify-end">
                <span className="label text-muted">{album.photos.length} ảnh</span>
                <a href={booking} target="_blank" rel="noopener noreferrer" className="btn-pill">
                  Đặt lịch concept này <ArrowIcon />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-3 py-12 md:px-10 md:py-16">
          {album.photos.length ? (
            <AlbumViewer photos={album.photos} title={album.title} />
          ) : (
            <p className="py-24 text-center font-display text-2xl text-muted">Album chưa có ảnh.</p>
          )}
        </section>

        {related.length > 0 && (
          <section className="mx-auto max-w-350 px-5 pt-16 md:px-10">
            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-line pt-14">
              <div>
                <h2 className="caps-display text-3xl md:text-4xl">Album khác</h2>
                <p className="mt-2 font-display text-xl text-gold italic md:text-2xl">cùng hạng mục {category.title.toLowerCase()}</p>
              </div>
              <TransitionLink href={`/${category.slug}`} type="nav-back" className="label text-muted transition-colors hover:text-gold">
                Xem tất cả →
              </TransitionLink>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {related.map((a) => (
                <AlbumCard key={a.id} album={a} eyebrow={category.title} navType="nav-lateral" />
              ))}
            </div>
          </section>
        )}

        <ContactCta category={category} />
      </main>
      <SiteFooter />
      </PageTransition>
    </>
  );
}
