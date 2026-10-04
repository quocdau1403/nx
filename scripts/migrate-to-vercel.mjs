// Chuyển dữ liệu từ bản chạy trên máy (SQLite prisma/dev.db + ảnh trong storage/photos)
// sang PostgreSQL (Neon) + Vercel Blob để chạy trên Vercel.
//
//   npm run migrate:vercel                 # dùng prisma/dev.db và thư mục storage/
//   npm run migrate:vercel -- <file.db> <thư mục storage>
//
// Yêu cầu trong .env: DATABASE_URL, DATABASE_URL_UNPOOLED (Neon) và BLOB_READ_WRITE_TOKEN.
// Chạy `npm run db:push` trước để tạo bảng. Chạy lại an toàn: dữ liệu đã chuyển sẽ được bỏ qua.
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

const WIDTHS = [480, 960, 1600, 2400];
const CONCURRENCY = 4;

const [dbArg = "prisma/dev.db", storageArg = process.env.STORAGE_DIR || "storage"] = process.argv.slice(2);
const sqlitePath = path.resolve(dbArg);
const photosDir = path.resolve(storageArg, "photos");

for (const name of ["DATABASE_URL", "BLOB_READ_WRITE_TOKEN"]) {
  if (!process.env[name]) {
    console.error(`Thiếu ${name} trong .env`);
    process.exit(1);
  }
}
if (process.env.DATABASE_URL.startsWith("file:")) {
  console.error("DATABASE_URL vẫn đang trỏ tới SQLite – hãy điền chuỗi kết nối PostgreSQL (Neon).");
  process.exit(1);
}
if (!existsSync(sqlitePath)) {
  console.error(`Không tìm thấy ${sqlitePath}`);
  process.exit(1);
}

const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
const db = new PrismaClient();
const all = (table) => sqlite.prepare(`SELECT * FROM "${table}"`).all();
// Prisma lưu DateTime trong SQLite dưới dạng số mili-giây (hoặc chuỗi ISO ở bản cũ).
const date = (v) => (v == null ? undefined : new Date(typeof v === "string" && /^\d+$/.test(v) ? Number(v) : v));

async function migrateUsers() {
  for (const u of all("User")) {
    const data = { name: u.name, passwordHash: u.passwordHash, role: u.role, createdAt: date(u.createdAt) };
    await db.user.upsert({ where: { email: u.email }, update: data, create: { id: u.id, email: u.email, ...data } });
  }
}

async function migrateAlbums() {
  const albums = all("Album");
  for (const a of albums) {
    await db.album.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        category: a.category,
        slug: a.slug,
        title: a.title,
        description: a.description,
        coverPhotoId: a.coverPhotoId,
        source: a.source,
        externalId: a.externalId,
        createdAt: date(a.createdAt),
        updatedAt: date(a.updatedAt),
      },
    });
  }
  return albums.length;
}

async function migratePhoto(p) {
  if (await db.photo.findUnique({ where: { id: p.id }, select: { id: true } })) return "skipped";

  const files = WIDTHS.map((w) => ({ w, file: path.join(photosDir, p.id, `${w}.webp`) }));
  const missing = files.filter((f) => !existsSync(f.file));
  if (missing.length) {
    console.warn(`  ! ${p.id}: thiếu file ${missing.map((f) => f.w).join(", ")} – bỏ qua`);
    return "failed";
  }

  for (const { w, file } of files) {
    await put(`photos/${p.id}/${w}.webp`, await readFile(file), {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 31536000,
    });
  }

  await db.photo.create({
    data: {
      id: p.id,
      albumId: p.albumId,
      position: p.position,
      width: p.width,
      height: p.height,
      blurDataUrl: p.blurDataUrl,
      externalId: p.externalId,
      createdAt: date(p.createdAt),
    },
  });
  return "added";
}

async function migratePhotos() {
  const photos = all("Photo");
  const count = { added: 0, skipped: 0, failed: 0 };
  let next = 0;
  async function worker() {
    while (next < photos.length) {
      const p = photos[next++];
      try {
        count[await migratePhoto(p)]++;
      } catch (error) {
        count.failed++;
        console.warn(`  ! ${p.id}: ${error instanceof Error ? error.message : error}`);
      }
      const done = count.added + count.skipped + count.failed;
      if (done % 10 === 0 || done === photos.length) console.log(`  … ${done}/${photos.length} ảnh`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return count;
}

try {
  console.log(`Nguồn: ${sqlitePath} + ${photosDir}`);
  await migrateUsers();
  console.log("✓ Tài khoản");
  console.log(`✓ ${await migrateAlbums()} album`);
  const c = await migratePhotos();
  console.log(`✓ Ảnh: +${c.added} mới, ${c.skipped} đã có${c.failed ? `, ${c.failed} lỗi (chạy lại để thử tiếp)` : ""}`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  sqlite.close();
  await db.$disconnect();
}
