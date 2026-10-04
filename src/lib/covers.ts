import "server-only";
import path from "node:path";
import type { Category } from "./categories";

// Danh sách file trong public/images/categories được next.config.ts ghi lại lúc build
// (trên Vercel, public/ được phục vụ qua CDN và không có trong ổ đĩa của serverless function).
const covers = new Set<string>(JSON.parse(process.env.CATEGORY_COVERS || "[]"));

/** Ảnh nền hạng mục có tồn tại trong public/ hay chưa. */
export function hasCoverFile(category: Category) {
  return covers.has(path.posix.basename(category.cover));
}
