import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import type { Category } from "./categories";

/** Ảnh nền hạng mục có tồn tại trong public/ hay chưa. */
export function hasCoverFile(category: Category) {
  return existsSync(path.join(process.cwd(), "public", category.cover));
}
