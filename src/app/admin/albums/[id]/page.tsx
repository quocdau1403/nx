import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteAlbum, updateAlbum } from "@/app/actions/admin";
import { AlbumForm } from "@/components/admin/album-form";
import { AlbumManager } from "@/components/admin/album-manager";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { SiteHeader } from "@/components/site/site-header";
import { requireAdmin } from "@/lib/auth";
import { getCategory } from "@/lib/categories";
import { db } from "@/lib/db";
import { photoViewSelect } from "@/lib/photos";

export const metadata = { title: "Quản lý album" };

type Props = { params: Promise<{ id: string }> };

export default async function AdminAlbumPage({ params }: Props) {
  const session = await requireAdmin();
  const { id } = await params;
  const album = await db.album.findUnique({
    where: { id },
    include: { photos: { orderBy: { position: "asc" }, select: photoViewSelect } },
  });
  if (!album) notFound();

  return (
    <>
      <SiteHeader user={session} />
      <main className="mx-auto max-w-6xl px-5 pb-24 md:px-10">
        <div className="py-12 md:py-16">
          <Link href="/admin" className="label text-muted transition-colors hover:text-gold">
            ← Quản trị
          </Link>
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="label text-gold">
                {getCategory(album.category)?.title}
                {album.source === "facebook" && " · Đồng bộ từ Facebook"}
              </p>
              <h1 className="caps-display mt-3 text-4xl md:text-5xl">{album.title}</h1>
            </div>
            <div className="label flex items-center gap-6">
              <Link href={`/${album.category}/${album.slug}`} className="text-muted transition-colors hover:text-ink">
                Xem trang album ↗
              </Link>
              <ConfirmSubmit
                action={deleteAlbum.bind(null, album.id)}
                message="Xoá album này cùng toàn bộ ảnh? Không thể hoàn tác."
                className="label text-red-700 hover:text-red-800"
              >
                Xoá album
              </ConfirmSubmit>
            </div>
          </div>
        </div>

        <section className="border border-line p-6 md:p-8">
          <AlbumForm
            action={updateAlbum.bind(null, album.id)}
            submitLabel="Lưu thay đổi"
            defaults={{ title: album.title, category: album.category, description: album.description }}
          />
        </section>

        <AlbumManager albumId={album.id} initialPhotos={album.photos} initialCoverId={album.coverPhotoId} />
      </main>
    </>
  );
}
