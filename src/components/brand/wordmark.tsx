import Image from "next/image";
import type { Ref } from "react";

type Props = {
  size?: "sm" | "lg";
  /** "dark" = chữ đậm cho nền sáng; "light" = chữ ngà khi logo nằm trên ảnh. */
  tone?: "dark" | "light";
  className?: string;
  /** Chỉ dùng trong client component (intro cần biết khi nào logo đã tải xong). */
  imgRef?: Ref<HTMLImageElement>;
  onLoad?: () => void;
};

// Logo là file SVG tĩnh (chữ đã outline) trong public/brand – sửa logo bằng cách thay file.
const LOGO = { width: 836, height: 153 };

export function Wordmark({ size = "sm", tone = "dark", className = "", imgRef, onLoad }: Props) {
  const lg = size === "lg";
  return (
    <Image
      ref={imgRef}
      onLoad={onLoad}
      src={`/brand/logo-${tone === "light" ? "light" : "dark"}.svg`}
      width={LOGO.width}
      height={LOGO.height}
      alt="Ngọc Xinh Studio"
      unoptimized
      priority
      className={`block h-auto ${lg ? "w-[min(78vw,560px)]" : "w-32 sm:w-40 md:w-52"} ${className}`}
    />
  );
}
