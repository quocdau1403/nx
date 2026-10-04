// Nhập ảnh từ thư mục trên máy vào một hạng mục.
//
//   npm run import -- <thư mục> <hạng mục>
//
// - Mỗi thư mục con = 1 album (tên thư mục = tên album).
// - Ảnh nằm trực tiếp trong <thư mục> → 1 album mang tên chính thư mục đó.
// - Ảnh sắp xếp theo tên file. Chạy lại an toàn: ảnh đã nhập sẽ được bỏ qua.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { CATEGORIES, getCategory } from "../src/lib/categories";
import { db } from "../src/lib/db";
import { ingestPhoto } from "../src/lib/photos";
import { uniqueAlbumSlug } from "../src/lib/slug";

const IMAGE = /\.(jpe?g|png|webp|avif|tiff?)$/i;
const byName = new Intl.Collator("vi", { numeric: true }).compare;

async function listImages(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isFile() && IMAGE.test(e.name)).map((e) => e.name).sort(byName);
}

async function importAlbum(category: string, title: string, dir: string, files: string[]) {
  const externalId = `import:${category}:${title}`;
  const album =
    (await db.album.findUnique({ where: { externalId } })) ??
    (await db.album.create({
      data: { externalId, source: "import", category, title, slug: await uniqueAlbumSlug(category, title) },
    }));

  let added = 0, skipped = 0, failed = 0;
  for (const file of files) {
    const photoId = `${externalId}/${file}`;
    if (await db.photo.findUnique({ where: { externalId: photoId }, select: { id: true } })) {
      skipped++;
      continue;
    }
    try {
      await ingestPhoto(album.id, await readFile(path.join(dir, file)), photoId);
      added++;
    } catch (error) {
      failed++;
      console.warn(`  ! ${file}: ${error instanceof Error ? error.message : error}`);
    }
  }
  console.log(`✓ ${title}: +${added} ảnh mới, ${skipped} đã có${failed ? `, ${failed} lỗi` : ""}  → /${category}/${album.slug}`);
}

async function main() {
  const [dirArg, category] = process.argv.slice(2);
  if (!dirArg || !category || !getCategory(category)) {
    console.error(`Cách dùng: npm run import -- <thư mục> <${CATEGORIES.map((c) => c.slug).join(" | ")}>`);
    process.exit(1);
  }
  const root = path.resolve(dirArg);
  const subdirs = (await readdir(root, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name).sort(byName);

  const direct = await listImages(root);
  if (direct.length) await importAlbum(category, path.basename(root), root, direct);
  for (const name of subdirs) {
    const files = await listImages(path.join(root, name));
    if (files.length) await importAlbum(category, name, path.join(root, name), files);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
