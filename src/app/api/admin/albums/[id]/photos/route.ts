import { del } from "@vercel/blob";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_UPLOAD_BYTES, ingestPhoto } from "@/lib/photos";
import { PHOTO_BASE_URL } from "@/lib/photo-urls";

type Params = { params: Promise<{ id: string }> };

// Tối ưu ảnh lớn (sharp) có thể mất vài chục giây.
export const maxDuration = 60;

/** Chỉ nhận ảnh gốc nằm trong thư mục uploads/ của chính kho Vercel Blob này. */
function uploadedBlobUrl(value: unknown) {
  if (typeof value !== "string" || !PHOTO_BASE_URL) return null;
  try {
    const url = new URL(value);
    const ok = url.origin === new URL(PHOTO_BASE_URL).origin && url.pathname.startsWith("/uploads/");
    return ok ? url : null;
  } catch {
    return null;
  }
}

// Client tải ảnh gốc lên Vercel Blob (xem /api/admin/uploads) rồi gửi URL vào đây, từng ảnh một.
// Vẫn nhận multipart "files" (ảnh nhỏ < 4.5 MB) cho tương thích.
export async function POST(req: Request, { params }: Params) {
  if (!(await getAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const album = await db.album.findUnique({ where: { id }, select: { id: true } });
  if (!album) return Response.json({ error: "Không tìm thấy album" }, { status: 404 });

  if (req.headers.get("content-type")?.includes("application/json")) {
    const { url: rawUrl, name } = (await req.json().catch(() => ({}))) as { url?: unknown; name?: unknown };
    const url = uploadedBlobUrl(rawUrl);
    const label = typeof name === "string" ? name : "Ảnh";
    if (!url) return Response.json({ error: "URL ảnh không hợp lệ" }, { status: 400 });

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const input = Buffer.from(await res.arrayBuffer());
      if (input.length > MAX_UPLOAD_BYTES) {
        return Response.json({ photos: [], errors: [`${label}: vượt quá 40MB`] }, { status: 422 });
      }
      const photo = await ingestPhoto(album.id, input);
      return Response.json({ photos: [photo], errors: [] });
    } catch {
      return Response.json({ photos: [], errors: [`${label}: không đọc được ảnh`] }, { status: 422 });
    } finally {
      // Ảnh gốc chỉ là file tạm – các bản WebP đã được lưu riêng.
      await del(url.toString()).catch(() => {});
    }
  }

  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return Response.json({ error: "Chưa chọn ảnh" }, { status: 400 });

  const photos = [];
  const errors: string[] = [];
  for (const file of files) {
    if (file.size > MAX_UPLOAD_BYTES) {
      errors.push(`${file.name}: vượt quá 40MB`);
      continue;
    }
    try {
      photos.push(await ingestPhoto(album.id, Buffer.from(await file.arrayBuffer())));
    } catch {
      errors.push(`${file.name}: không đọc được ảnh`);
    }
  }

  return Response.json({ photos, errors }, { status: photos.length ? 200 : 422 });
}
