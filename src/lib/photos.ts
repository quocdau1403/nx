import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { db } from "./db";
import { PHOTO_WIDTHS, type PhotoWidth } from "./photo-urls";

export const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;
export const PHOTO_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "tiff"]);

const storageRoot = () => path.resolve(process.cwd(), process.env.STORAGE_DIR || "storage", "photos");
const photoDir = (id: string) => path.join(storageRoot(), id);
export const photoFile = (id: string, width: PhotoWidth) => path.join(photoDir(id), `${width}.webp`);

export const photoViewSelect = { id: true, width: true, height: true, blurDataUrl: true } as const;

/**
 * Tối ưu một ảnh gốc: xoay theo EXIF, xuất WebP ở nhiều kích cỡ, tạo blur placeholder,
 * rồi thêm vào cuối album.
 */
export async function ingestPhoto(albumId: string, input: Buffer, externalId?: string) {
  const meta = await sharp(input).metadata();
  if (!meta.format || !ACCEPTED_FORMATS.has(meta.format) || !meta.width || !meta.height) {
    throw new Error("Định dạng ảnh không được hỗ trợ");
  }
  const rotated = (meta.orientation ?? 1) >= 5;
  const width = rotated ? meta.height : meta.width;
  const height = rotated ? meta.width : meta.height;

  const id = randomUUID();
  const dir = photoDir(id);
  await mkdir(dir, { recursive: true });

  try {
    const base = sharp(input, { failOn: "none" }).rotate();
    await Promise.all(
      PHOTO_WIDTHS.map((w) =>
        base
          .clone()
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(photoFile(id, w)),
      ),
    );
    const blur = await base.clone().resize(24).webp({ quality: 40 }).toBuffer();

    const last = await db.photo.findFirst({
      where: { albumId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    return await db.photo.create({
      data: {
        id,
        albumId,
        width,
        height,
        blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
        position: (last?.position ?? -1) + 1,
        externalId,
      },
      select: photoViewSelect,
    });
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
}

export async function removePhotoFiles(ids: string[]) {
  await Promise.all(ids.map((id) => rm(photoDir(id), { recursive: true, force: true })));
}
