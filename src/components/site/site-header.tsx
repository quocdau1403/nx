import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { Wordmark } from "@/components/brand/wordmark";
import { CATEGORIES } from "@/lib/categories";
import { SITE } from "@/lib/site";
import { ArrowIcon } from "./arrow-icon";
import { TransitionLink, type NavType } from "./transition-link";
import type { NavUser } from "./user-nav";

type Props = {
  user: NavUser | null;
  /** slug hạng mục đang xem, để đánh dấu menu */
  current?: string;
  bookingUrl?: string;
};

// Về trang chủ = quay lên; giữa các hạng mục = ngang hàng
const NAV: { href: string; key: string; label: string; type: NavType }[] = [
  { href: "/", key: "", label: "Trang chủ", type: "nav-back" },
  ...CATEGORIES.map((c) => ({ href: `/${c.slug}`, key: c.slug, label: c.title, type: "nav-lateral" as const })),
];

const navLink =
  "relative py-2 text-muted transition-colors duration-300 hover:text-ink aria-[current=page]:text-ink " +
  "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-gold " +
  "after:transition-transform after:duration-500 hover:after:scale-x-100 aria-[current=page]:after:scale-x-100";

export function SiteHeader({ user, current, bookingUrl = SITE.bookingUrl }: Props) {
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-350 items-center justify-between gap-6 px-5 py-3.5 md:px-10">
        <TransitionLink href="/" type="nav-back" aria-label="Ngọc Xinh Studio — Trang chủ">
          <Wordmark />
        </TransitionLink>

        <nav aria-label="Hạng mục" className="label hidden items-center gap-10 lg:flex">
          {NAV.map((n) => (
            <TransitionLink key={n.href} href={n.href} type={n.type} aria-current={current === n.key ? "page" : undefined} className={navLink}>
              {n.label}
            </TransitionLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-5">
          {isAdmin && (
            <>
              <Link href="/admin" className="label hidden text-muted transition-colors hover:text-ink sm:inline">
                Quản trị
              </Link>
              <form action={logout} className="hidden sm:block">
                <button type="submit" className="label cursor-pointer text-muted transition-colors hover:text-ink">
                  Đăng xuất
                </button>
              </form>
            </>
          )}
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="btn-pill hidden sm:inline-flex">
            Đặt lịch <ArrowIcon />
          </a>

          {/* Menu mobile: <details> hoạt động không cần JS, tự đóng khi chuyển trang (header mount lại) */}
          <details className="group relative lg:hidden">
            <summary
              aria-label="Mở menu"
              className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full border border-line transition-colors hover:border-gold [&::-webkit-details-marker]:hidden"
            >
              <span aria-hidden className="relative block h-2.5 w-4">
                <span className="absolute inset-x-0 top-0 h-px bg-ink transition-transform duration-300 group-open:translate-y-1.25 group-open:rotate-45" />
                <span className="absolute inset-x-0 bottom-0 h-px bg-ink transition-transform duration-300 group-open:-translate-y-1.25 group-open:-rotate-45" />
              </span>
            </summary>
            <div className="absolute top-14 right-0 w-[min(80vw,300px)] rounded-2xl bg-card p-3 shadow-soft">
              <ul className="label">
                {NAV.map((n) => (
                  <li key={n.href}>
                    <TransitionLink
                      href={n.href}
                      type={n.type}
                      aria-current={current === n.key ? "page" : undefined}
                      className="block rounded-xl px-4 py-3.5 text-muted transition-colors hover:bg-surface hover:text-ink aria-[current=page]:text-gold"
                    >
                      {n.label}
                    </TransitionLink>
                  </li>
                ))}
                {isAdmin && (
                  <li>
                    <Link href="/admin" className="block rounded-xl px-4 py-3.5 text-muted hover:bg-surface hover:text-ink">
                      Quản trị
                    </Link>
                  </li>
                )}
              </ul>
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="btn-pill mt-2 w-full justify-center sm:hidden">
                Đặt lịch <ArrowIcon />
              </a>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
