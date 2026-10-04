// Dùng được ở cả client và server.
export const PHOTO_WIDTHS = [480, 960, 1600, 2400] as const;
export type PhotoWidth = (typeof PHOTO_WIDTHS)[number];

export type PhotoView = { id: string; width: number; height: number; blurDataUrl: string };

export const photoSrc = (id: string, width: PhotoWidth) => `/api/photos/${id}/${width}`;

/** Các bản resize thực sự khác nhau (ảnh nhỏ không bị phóng to). */
export function availableWidths(originalWidth: number) {
  const widths: PhotoWidth[] = [];
  for (const w of PHOTO_WIDTHS) {
    widths.push(w);
    if (w >= originalWidth) break;
  }
  return widths;
}

export function photoSrcSet(photo: PhotoView) {
  return availableWidths(photo.width)
    .map((w) => `${photoSrc(photo.id, w)} ${Math.min(w, photo.width)}w`)
    .join(", ");
}
