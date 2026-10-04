import "server-only";
import { randomUUID } from "node:crypto";
import { del, put } from "@vercel/blob";
import sharp from "sharp";
import { db } from "./db";
import { PHOTO_WIDTHS, photoPathname, photoSrc } from "./photo-urls";

export const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;
export const ACCEPTED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/tiff"];

const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "tiff"]);

export const photoViewSelect = { id: true, width: true, height: true, blurDataUrl: true } as const;

const photoUrls = (id: string) => PHOTO_WIDTHS.map((w) => photoSrc(id, w));

/**
 * Tối ưu một ảnh gốc: xoay theo EXIF, xuất WebP ở nhiều kích cỡ lên Vercel Blob, tạo blur placeholder,
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

  try {
    const base = sharp(input, { failOn: "none" }).rotate();
    await Promise.all(
      PHOTO_WIDTHS.map(async (w) => {
        const file = await base.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
        await put(photoPathname(id, w), file, {
          access: "public",
          contentType: "image/webp",
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 31536000,
        });
      }),
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
    await del(photoUrls(id)).catch(() => {});
    throw error;
  }
}

export async function removePhotoFiles(ids: string[]) {
  if (!ids.length) return;
  await del(ids.flatMap(photoUrls)).catch((error) => console.error("Không xoá được ảnh trên Blob:", error));
}
