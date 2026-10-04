"use client";

import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/wordmark";

// Tối đa chờ logo bao lâu trước khi vẫn cho intro chạy (mạng rất chậm / ảnh lỗi).
const MAX_WAIT_MS = 2500;

/**
 * Màn intro. Toàn bộ animation của intro và trang chủ phía sau tạm dừng (CSS: .intro-overlay:not(.is-ready))
 * cho tới khi logo đã tải + giải mã xong, để máy/mạng chậm không bị lướt qua intro.
 */
export function IntroOverlay() {
  const [ready, setReady] = useState(false);
  const logo = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let done = false;
    const start = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    const img = logo.current;
    // Ảnh có thể đã tải xong trước khi React hydrate → onLoad không chạy lại; decode() đảm bảo đã vẽ được.
    if (img?.complete) img.decode().catch(() => { }).finally(start);
    const timeout = setTimeout(start, MAX_WAIT_MS);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <div
        aria-hidden
        className={`intro-overlay fixed inset-0 z-50 flex items-center justify-center bg-paper ${ready ? "is-ready" : ""}`}
      >
        <div className="flex flex-col items-center">
          <Wordmark size="lg" className="intro-logo" imgRef={logo} onLoad={() => setReady(true)} />
          <span className="intro-line mt-10 block h-px w-20 bg-gold/50" />
        </div>
      </div>
      {/* Không có JavaScript thì không ai thêm .is-ready → cho animation chạy luôn */}
      <noscript>
        <style>{".intro-overlay, .intro-overlay *, .intro-overlay ~ * * { animation-play-state: running !important; }"}</style>
      </noscript>
    </>
  );
}
