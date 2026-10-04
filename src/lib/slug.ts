import "server-only";
import { db } from "./db";

export function slugify(input: string) {
  return (
    input
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "album"
  );
}

export async function uniqueAlbumSlug(category: string, title: string, excludeId?: string) {
  const base = slugify(title);
  let slug = base;
  for (let i = 2; ; i++) {
    const taken = await db.album.findFirst({
      where: { category, slug, NOT: excludeId ? { id: excludeId } : undefined },
      select: { id: true },
    });
    if (!taken) return slug;
    slug = `${base}-${i}`;
  }
}
