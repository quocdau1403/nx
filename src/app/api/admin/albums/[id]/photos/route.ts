import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_UPLOAD_BYTES, ingestPhoto } from "@/lib/photos";

type Params = { params: Promise<{ id: string }> };

// Bulk upload: client gửi từng file một để hiển thị tiến độ; endpoint cũng nhận nhiều file.
export async function POST(req: Request, { params }: Params) {
  if (!(await getAdminSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const album = await db.album.findUnique({ where: { id }, select: { id: true } });
  if (!album) return Response.json({ error: "Không tìm thấy album" }, { status: 404 });

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
