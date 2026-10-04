import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <p className="label text-gold">404</p>
      <h1 className="caps-display text-4xl md:text-6xl">Không tìm thấy trang</h1>
      <Link href="/" className="label text-muted transition-colors hover:text-gold">
        ← Trang chủ
      </Link>
    </main>
  );
}
