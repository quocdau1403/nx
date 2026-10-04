import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { CATEGORIES } from "@/lib/categories";
import { SITE } from "@/lib/site";
import { TransitionLink } from "./transition-link";

const heading = "label text-ink";
const item = "text-sm text-muted transition-colors duration-300 hover:text-gold";

export function SiteFooter() {
  return (
    <footer className="mt-28 border-t border-line">
      <div className="mx-auto grid max-w-350 gap-12 px-5 py-16 sm:grid-cols-2 md:px-10 lg:grid-cols-[1.6fr_1fr_1.2fr]">
        <div>
          <Wordmark />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted">
            Ảnh cưới · Make up · Ảnh concept. Lưu giữ vẻ đẹp tự nhiên và trọn vẹn cảm xúc trong từng khung hình.
          </p>
        </div>

        <div>
          <h2 className={heading}>Hạng mục</h2>
          <ul className="mt-6 space-y-3.5">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <TransitionLink href={`/${c.slug}`} type="nav-lateral" className={item}>
                  {c.title}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={heading}>Kết nối</h2>
          <ul className="mt-6 space-y-3.5">
            {CATEGORIES.flatMap(({ slug, facebook }) =>
              facebook ? (
                <li key={slug}>
                  <a href={facebook.url} target="_blank" rel="noopener noreferrer" className={item}>
                    Facebook · {facebook.name}
                  </a>
                </li>
              ) : [],
            )}
            {SITE.hotline && <li className="text-sm text-muted">Hotline: {SITE.hotline}</li>}
            {SITE.address && <li className="text-sm text-muted">{SITE.address}</li>}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-350 flex-col gap-2 px-5 py-6 text-xs text-muted sm:flex-row sm:justify-between md:px-10">
          <p>© {new Date().getFullYear()} Ngọc Xinh Studio</p>
          <Link href="/admin" className="transition-colors hover:text-ink">
            Quản trị
          </Link>
        </div>
      </div>
    </footer>
  );
}
