"use client";

import { unstable_addTransitionType as addTransitionType, startTransition, useCallback, useEffect, useRef, useState } from "react";
import { ViewTransition } from "@/lib/view-transition";
import { ArrowIcon } from "@/components/site/arrow-icon";
import { photoSrc, photoSrcSet, type PhotoView } from "@/lib/photo-urls";
import { PhotoImg } from "./photo-img";

type Props = { photos: PhotoView[]; title: string };

/** Xem ảnh cuộn dọc; chạm/click một ảnh để mở Lightbox toàn màn hình. */
export function AlbumViewer({ photos, title }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  // Mọi thay đổi của lightbox chạy trong transition để <ViewTransition> tạo hiệu ứng.
  const openAt = (i: number) => startTransition(() => setOpen(i));
  const close = useCallback(() => startTransition(() => setOpen(null)), []);
  const step = useCallback((i: number, direction: "next" | "prev") => {
    startTransition(() => {
      addTransitionType(direction);
      setOpen(i);
    });
  }, []);

  return (
    <>
      <div className="flex flex-col items-center gap-3 md:gap-8">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => openAt(i)}
            aria-label={`Xem ảnh ${i + 1} toàn màn hình`}
            className="block max-w-full cursor-zoom-in"
          >
            <PhotoImg
              photo={photo}
              eager={i < 2}
              alt={`${title} — ảnh ${i + 1}`}
              sizes="(min-width: 1024px) 75vw, 100vw"
              className="block h-auto max-h-[92svh] w-auto max-w-full rounded-xl"
            />
          </button>
        ))}
      </div>

      {open !== null && (
        <ViewTransition enter="scale-in" exit="scale-out" default="none">
          <Lightbox photos={photos} index={open} title={title} onStep={step} onClose={close} />
        </ViewTransition>
      )}
    </>
  );
}

type LightboxProps = {
  photos: PhotoView[];
  index: number;
  title: string;
  onStep: (i: number, direction: "next" | "prev") => void;
  onClose: () => void;
};

function Lightbox({ photos, index, title, onStep, onClose }: LightboxProps) {
  const photo = photos[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipeStart = useRef<number | null>(null);

  const go = useCallback(
    (delta: 1 | -1) => onStep((index + delta + photos.length) % photos.length, delta > 0 ? "next" : "prev"),
    [index, onStep, photos.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [go, onClose]);

  useEffect(() => closeRef.current?.focus(), []);

  // Tải trước ảnh kế bên để khi bấm sau/trước ảnh đã sẵn sàng, không bị trống lúc trượt.
  useEffect(() => {
    if (photos.length < 2) return;
    for (const delta of [1, -1]) {
      const p = photos[(index + delta + photos.length) % photos.length];
      const img = new window.Image();
      img.sizes = "100vw";
      img.srcset = photoSrcSet(p);
      img.src = photoSrc(p.id, 1600);
    }
  }, [index, photos]);

  const navButton =
    "absolute top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-ink/25 transition-colors duration-300 hover:border-gold hover:text-gold md:flex";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — trình xem ảnh`}
      className="fixed inset-0 z-50 flex touch-pan-y items-center justify-center bg-paper"
      onPointerDown={(e) => (swipeStart.current = e.clientX)}
      onPointerUp={(e) => {
        if (swipeStart.current === null) return;
        const dx = e.clientX - swipeStart.current;
        swipeStart.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <ViewTransition
        key={photo.id}
        enter={{ next: "slide-from-right", prev: "slide-from-left", default: "none" }}
        exit={{ next: "slide-to-left", prev: "slide-to-right", default: "none" }}
        default="none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh đã tối ưu sẵn nhiều kích cỡ */}
        <img
          src={photoSrc(photo.id, 1600)}
          srcSet={photoSrcSet(photo)}
          sizes="100vw"
          width={photo.width}
          height={photo.height}
          alt={`${title} — ảnh ${index + 1}`}
          draggable={false}
          decoding="async"
          style={{ backgroundImage: `url(${photo.blurDataUrl})`, backgroundSize: "cover" }}
          className="h-auto max-h-svh w-auto max-w-full select-none md:max-h-[90svh] md:max-w-[88vw]"
        />
      </ViewTransition>

      <div className="label absolute inset-x-0 top-0 flex items-center justify-between px-5 py-5 md:px-10">
        <span className="text-muted tabular-nums">
          {String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
        </span>
        <button ref={closeRef} type="button" onClick={onClose} className="label cursor-pointer transition-colors hover:text-gold">
          Đóng ✕
        </button>
      </div>

      {photos.length > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Ảnh trước" className={`${navButton} left-6`}>
            <ArrowIcon className="rotate-180" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Ảnh sau" className={`${navButton} right-6`}>
            <ArrowIcon />
          </button>
        </>
      )}
    </div>
  );
}
