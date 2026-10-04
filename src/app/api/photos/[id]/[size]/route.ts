import { readFile } from "node:fs/promises";
import { PHOTO_WIDTHS, type PhotoWidth } from "@/lib/photo-urls";
import { PHOTO_ID, photoFile } from "@/lib/photos";

type Params = { params: Promise<{ id: string; size: string }> };

// Ảnh công khai; mỗi id là UUID bất biến nên cache vĩnh viễn được.
export async function GET(_req: Request, { params }: Params) {
  const { id, size } = await params;
  const width = Number(size) as PhotoWidth;
  if (!PHOTO_ID.test(id) || !PHOTO_WIDTHS.includes(width)) return new Response("Not found", { status: 404 });

  try {
    const file = await readFile(photoFile(id, width));
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
