import "server-only";
import { db } from "./db";
import type { PhotoView } from "./photo-urls";
import { photoViewSelect } from "./photos";

export type AlbumSummary = {
  id: string;
  slug: string;
  title: string;
  category: string;
  count: number;
  cover: PhotoView | null;
};

/** Danh sách album kèm ảnh cover (cover đã chọn, hoặc ảnh đầu tiên). */
export async function listAlbums(category?: string): Promise<AlbumSummary[]> {
  const albums = await db.album.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { photos: true } },
      photos: { orderBy: { position: "asc" }, take: 1, select: photoViewSelect },
    },
  });

  const coverIds = albums.map((a) => a.coverPhotoId).filter((id): id is string => Boolean(id));
  const covers = new Map(
    (await db.photo.findMany({ where: { id: { in: coverIds } }, select: photoViewSelect })).map((p) => [p.id, p]),
  );

  return albums.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    category: a.category,
    count: a._count.photos,
    cover: (a.coverPhotoId && covers.get(a.coverPhotoId)) || a.photos[0] || null,
  }));
}
