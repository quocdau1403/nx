import { CategoryGate } from "@/components/home/category-gate";
import { getSession } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";
import { hasCoverFile } from "@/lib/covers";

export default async function HomePage() {
  const session = await getSession();
  // Hạng mục chưa có ảnh nền trong public/ hiển thị nền màu thay vì ảnh lỗi.
  const withCover = CATEGORIES.filter(hasCoverFile).map((c) => c.slug);
  return <CategoryGate user={session} withCover={withCover} />;
}
