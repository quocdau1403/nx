import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getAdminSession } from "@/lib/auth";
import { ACCEPTED_CONTENT_TYPES, MAX_UPLOAD_BYTES } from "@/lib/photos";

// Cấp token để trình duyệt tải ảnh gốc thẳng lên Vercel Blob (thư mục uploads/),
// tránh giới hạn 4.5 MB/request của serverless function trên Vercel.
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await getAdminSession())) throw new Error("Unauthorized");
        if (!pathname.startsWith("uploads/")) throw new Error("Đường dẫn không hợp lệ");
        return {
          allowedContentTypes: ACCEPTED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return Response.json(json);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Không tạo được token" }, { status: 400 });
  }
}
