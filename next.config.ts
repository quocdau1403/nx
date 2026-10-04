import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

/**
 * URL gốc của kho ảnh Vercel Blob (public), ví dụ https://abc123.public.blob.vercel-storage.com.
 * Lấy từ NEXT_PUBLIC_PHOTO_BASE_URL nếu có, nếu không thì suy ra từ BLOB_STORE_ID / BLOB_READ_WRITE_TOKEN
 * (token có dạng vercel_blob_rw_<storeId>_<bí mật>). Được nhúng vào bundle lúc build để client dựng URL ảnh.
 */
function photoBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_PHOTO_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const storeId =
    process.env.BLOB_STORE_ID?.trim().replace(/^store_/, "") ||
    process.env.BLOB_READ_WRITE_TOKEN?.split("_")[3] ||
    "";
  return storeId ? `https://${storeId.toLowerCase()}.public.blob.vercel-storage.com` : "";
}

/** Ảnh nền hạng mục có trong public/ – kiểm tra lúc build vì trên Vercel thư mục public/ không nằm trong serverless function. */
function categoryCovers() {
  const dir = path.join(process.cwd(), "public", "images", "categories");
  return existsSync(dir) ? readdirSync(dir) : [];
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_PHOTO_BASE_URL: photoBaseUrl(),
    CATEGORY_COVERS: JSON.stringify(categoryCovers()),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1080, 1440, 1920, 2560],
  },
  experimental: {
    // Bật <ViewTransition> của React cho chuyển trang mượt (fallback: trình duyệt cũ chuyển trang bình thường)
    viewTransition: true,
  },
};

export default nextConfig;
