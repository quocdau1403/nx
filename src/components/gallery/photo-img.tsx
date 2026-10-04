import { availableWidths, photoSrc, photoSrcSet, type PhotoView } from "@/lib/photo-urls";

type Props = {
  photo: PhotoView;
  sizes: string;
  alt?: string;
  eager?: boolean;
  className?: string;
  draggable?: boolean;
};

/** Ảnh responsive (srcset WebP nhiều kích cỡ) + lazy-load + blur placeholder. */
export function PhotoImg({ photo, sizes, alt = "", eager = false, className = "", draggable }: Props) {
  const widths = availableWidths(photo.width);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ảnh được phục vụ qua route có xác thực, đã tối ưu sẵn
    <img
      src={photoSrc(photo.id, widths[Math.min(1, widths.length - 1)])}
      srcSet={photoSrcSet(photo)}
      sizes={sizes}
      width={photo.width}
      height={photo.height}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      draggable={draggable}
      style={{ backgroundImage: `url(${photo.blurDataUrl})`, backgroundSize: "cover" }}
      className={className}
    />
  );
}
