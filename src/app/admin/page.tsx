import Link from "next/link";
import { createAlbum } from "@/app/actions/admin";
import { AlbumForm } from "@/components/admin/album-form";
import { FacebookSyncButton } from "@/components/admin/facebook-sync-button";
import { PhotoImg } from "@/components/gallery/photo-img";
import { SiteHeader } from "@/components/site/site-header";
import { listAlbums } from "@/lib/albums";
import { requireAdmin } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";
import { facebookToken } from "@/lib/facebook";

export const metadata = { title: "Quản trị" };

export default async function AdminPage() {
  const session = await requireAdmin();
  const albums = await listAlbums();

  return (
    <>
      <SiteHeader user={session} />
      <main className="mx-auto max-w-6xl px-5 pb-24 md:px-10">
        <h1 className="caps-display py-12 text-4xl md:py-16 md:text-6xl">Quản trị</h1>

        <section className="border border-line p-6 md:p-8">
          <h2 className="label mb-6 text-gold">Tạo album mới</h2>
          <AlbumForm action={createAlbum} submitLabel="Tạo album" />
        </section>

        {CATEGORIES.map((c) => {
          const items = albums.filter((a) => a.category === c.slug);
          return (
            <section key={c.slug} className="mt-16">
              <div className="flex flex-col gap-4 border-b border-line pb-4 md:flex-row md:items-end md:justify-between">
                <h2 className="flex items-baseline gap-4">
                  <span className="font-display text-2xl text-gold">{c.index}</span>
                  <span className="font-display text-3xl uppercase tracking-[0.12em]">{c.title}</span>
                  <span className="label text-muted">{items.length} album</span>
                </h2>
                {c.facebook ? (
                  <FacebookSyncButton
                    category={c.slug}
                    configured={Boolean(facebookToken(c))}
                    pageUrl={c.facebook.url}
                  />
                ) : (
                  <p className="label text-muted">Upload thủ công</p>
                )}
              </div>

              {items.length ? (
                <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {items.map((a) => (
                    <li key={a.id}>
                      <Link href={`/admin/albums/${a.id}`} className="group block">
                        <div className="aspect-4/5 overflow-hidden bg-surface">
                          {a.cover && (
                            <PhotoImg
                              photo={a.cover}
                              sizes="(min-width: 1024px) 25vw, 50vw"
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          )}
                        </div>
                        <p className="mt-3 truncate text-sm transition-colors group-hover:text-gold">{a.title}</p>
                        <p className="label mt-1 text-muted">{a.count} ảnh</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-6 text-sm text-muted">Chưa có album.</p>
              )}
            </section>
          );
        })}
      </main>
    </>
  );
}
