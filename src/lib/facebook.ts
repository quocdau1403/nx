import "server-only";
import type { Category } from "./categories";
import { db } from "./db";
import { ingestPhoto } from "./photos";
import { uniqueAlbumSlug } from "./slug";

// Đồng bộ album/ảnh từ một Facebook Page qua Graph API.
// Token: Page Access Token của fanpage (quản trị viên fanpage tạo trong Meta for Developers).
const GRAPH = `https://graph.facebook.com/${process.env.FB_GRAPH_VERSION || "v21.0"}`;
const SKIPPED_ALBUM_TYPES = new Set(["profile", "cover"]);

type Paged<T> = { data: T[]; paging?: { next?: string } };
type FbAlbum = { id: string; name: string; description?: string; type?: string };
type FbPhoto = { id: string; images?: { width: number; height: number; source: string }[] };

export type SyncResult = { albums: number; photos: number; skipped: number; failed: number };

export function facebookToken(category: Category) {
  return category.facebook ? process.env[category.facebook.tokenEnv] || null : null;
}

async function graph<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message ?? `Facebook API lỗi ${res.status}`);
  return json as T;
}

async function* paginate<T>(pathAndQuery: string, token: string) {
  const first = new URL(`${GRAPH}/${pathAndQuery}`);
  first.searchParams.set("access_token", token);
  let next: string | undefined = first.toString();
  while (next) {
    const page: Paged<T> = await graph<Paged<T>>(next);
    yield* page.data;
    next = page.paging?.next;
  }
}

/** Idempotent: ảnh đã đồng bộ (theo externalId) sẽ được bỏ qua, nên có thể chạy lại để tiếp tục. */
export async function syncFacebookCategory(category: Category): Promise<SyncResult> {
  if (!category.facebook) throw new Error(`Hạng mục ${category.title} không gắn fanpage.`);
  const token = facebookToken(category);
  if (!token) throw new Error(`Chưa cấu hình ${category.facebook.tokenEnv} trong .env`);

  const result: SyncResult = { albums: 0, photos: 0, skipped: 0, failed: 0 };

  for await (const fbAlbum of paginate<FbAlbum>("me/albums?fields=id,name,description,type&limit=50", token)) {
    if (fbAlbum.type && SKIPPED_ALBUM_TYPES.has(fbAlbum.type)) continue;

    const externalId = `fb:${fbAlbum.id}`;
    const album =
      (await db.album.findUnique({ where: { externalId } })) ??
      (await db.album.create({
        data: {
          externalId,
          source: "facebook",
          category: category.slug,
          title: fbAlbum.name,
          description: fbAlbum.description,
          slug: await uniqueAlbumSlug(category.slug, fbAlbum.name),
        },
      }));
    result.albums++;

    for await (const fbPhoto of paginate<FbPhoto>(`${fbAlbum.id}/photos?fields=id,images&limit=100`, token)) {
      const photoExternalId = `fb:${fbPhoto.id}`;
      const exists = await db.photo.findUnique({ where: { externalId: photoExternalId }, select: { id: true } });
      if (exists) {
        result.skipped++;
        continue;
      }
      const best = fbPhoto.images?.reduce((a, b) => (b.width > a.width ? b : a));
      if (!best) {
        result.failed++;
        continue;
      }
      try {
        const res = await fetch(best.source);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await ingestPhoto(album.id, Buffer.from(await res.arrayBuffer()), photoExternalId);
        result.photos++;
      } catch {
        result.failed++;
      }
    }
  }

  return result;
}
