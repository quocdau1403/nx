"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { PageTransition } from "@/components/site/page-transition";
import { UserNav, type NavUser } from "@/components/site/user-nav";
import { CATEGORIES } from "@/lib/categories";
import { SITE } from "@/lib/site";
import { CategoryPanel } from "./category-panel";
import { IntroOverlay } from "./intro-overlay";

// Intro chỉ chạy ở lần tải trang đầu; quay lại trang chủ bằng điều hướng client thì bỏ qua.
// Cờ này chỉ được ghi trong effect (trình duyệt). Server và lần hydrate luôn trả "có intro"
// (getServerSnapshot) nên HTML hai phía luôn khớp – không ghi cờ trong lúc render, vì trên
// server biến module dùng chung giữa mọi request.
let introPlayed = false;
const noopSubscribe = () => () => { };

function useShouldPlayIntro() {
  const play = useSyncExternalStore(
    noopSubscribe,
    () => !introPlayed,
    () => true,
  );
  useEffect(() => {
    introPlayed = true;
  }, []);
  return play;
}

const INTRO_DELAY = 2.9;
const STAGGER = 0.15;

export function CategoryGate({ user, withCover }: { user: NavUser | null; withCover: string[] }) {
  const withIntro = useShouldPlayIntro();
  const base = withIntro ? INTRO_DELAY : 0.1;
  const contact = [SITE.address, SITE.hotline && `Hotline: ${SITE.hotline}`].filter(Boolean).join("  •  ");

  return (
    <>
      {withIntro && <IntroOverlay />}

      <PageTransition>
        <main className="relative flex min-h-dvh flex-col md:h-dvh">
          <header
            className="fade-up pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 px-6 pt-6 md:px-10 md:pt-8 *:pointer-events-auto"
            style={{ "--delay": `${base + 0.5}s` } as React.CSSProperties}
          >
            <Link href="/" aria-label="Ngọc Xinh Studio — Trang chủ">
              <Wordmark tone="light" />
            </Link>
            <UserNav user={user} onPhoto />
          </header>

          <h1 className="sr-only">Ngọc Xinh Studio — Chọn hạng mục</h1>

          {/* Mobile xếp chồng · tablet/desktop 3 cột dọc; gap-px trên nền line tạo đường kẻ mảnh */}
          <nav aria-label="Hạng mục" className="panel-nav flex flex-1 flex-col gap-px bg-line md:flex-row">
            {CATEGORIES.map((c, i) => (
              <CategoryPanel key={c.slug} category={c} hasCover={withCover.includes(c.slug)} delay={base + i * STAGGER} />
            ))}
          </nav>

          <footer
            className="label fade-up pointer-events-none z-20 flex flex-col gap-4 px-6 py-6 text-muted md:absolute md:text-ivory/55 md:inset-x-0 md:bottom-0 md:flex-row md:items-center md:justify-between md:px-10 md:py-7 *:pointer-events-auto"
            style={{ "--delay": `${base + 0.8}s` } as React.CSSProperties}
          >
            {contact ? <p>{contact}</p> : <span aria-hidden />}
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {CATEGORIES.flatMap(({ slug, facebook }) =>
                facebook ? (
                  <li key={slug}>
                    <a
                      href={facebook.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors duration-300 hover:text-ink md:hover:text-ivory/90"
                    >
                      Facebook {facebook.label}
                    </a>
                  </li>
                ) : [],
              )}
            </ul>
          </footer>
        </main>
      </PageTransition>
    </>
  );
}
