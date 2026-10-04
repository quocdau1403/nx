import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { SITE } from "@/lib/site";

export type NavUser = { name: string; role: string };

type Props = {
  user: NavUser | null;
  /** Nav nằm trên ảnh (trang chủ) → chữ ngà; mặc định nằm trên nền sáng. */
  onPhoto?: boolean;
};

/** Người xem không cần tài khoản; chỉ admin đăng nhập (qua /admin). */
export function UserNav({ user, onPhoto = false }: Props) {
  const isAdmin = user?.role === "ADMIN";
  const hover = onPhoto ? "hover:text-gold-soft" : "hover:text-gold";
  const link = `transition-colors duration-300 ${hover}`;
  const box = `border px-4 py-2 transition-colors duration-300 ${
    onPhoto ? "border-ivory/40 hover:border-gold-soft" : "border-line hover:border-gold"
  } ${hover}`;

  return (
    <nav aria-label="Điều hướng" className={`label flex items-center gap-4 whitespace-nowrap md:gap-8 ${onPhoto ? "text-ivory" : ""}`}>
      <a href={SITE.bookingUrl} target="_blank" rel="noopener noreferrer" className={link}>
        Đặt lịch
      </a>
      {isAdmin && (
        <form action={logout}>
          <button type="submit" className={`label cursor-pointer ${link}`}>
            Đăng xuất
          </button>
        </form>
      )}
      <Link href="/admin" className={box}>
        Admin
      </Link>
    </nav>
  );
}
