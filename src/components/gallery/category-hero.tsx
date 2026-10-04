import Image from "next/image";
import { ViewTransition } from "@/lib/view-transition";
import { ArrowIcon } from "@/components/site/arrow-icon";
import type { AlbumSummary } from "@/lib/albums";
import type { Category } from "@/lib/categories";
import type { PhotoView } from "@/lib/photo-urls";
import { PhotoImg } from "./photo-img";

type Props = {
  category: Category;
  /** Ảnh nền hạng mục có trong public/ */
  hasCover: boolean;
  albums: AlbumSummary[];
  totalPhotos: number;
  bookingUrl: string;
};

const frame = "panel-reveal relative overflow-hidden bg-surface shadow-soft";

/**
 * Đầu trang danh mục kiểu editorial: nội dung bên trái, cụm ảnh dọc bên phải.
 * Ảnh dọc được giữ đúng tỷ lệ thay vì kéo giãn thành banner ngang.
 */
export function CategoryHero({ category, hasCover, albums, totalPhotos, bookingUrl }: Props) {
  const covers = albums.map((a) => a.cover).filter((c): c is PhotoView => Boolean(c));
  const mainPhoto = hasCover ? null : covers.shift() ?? null;
  // Ảnh nền hạng mục thường lấy từ album mới nhất → ảnh phụ bỏ qua album đó để đa dạng hơn.
  const side = (hasCover && covers.length > 2 ? covers.slice(1) : covers).slice(0, 2);
  const hasMain = hasCover || mainPhoto;

  return (
    <section className="mx-auto max-w-350 px-5 pt-10 pb-20 md:px-10 md:pt-14 md:pb-28">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <div className="fade-up order-2 lg:order-1" style={{ "--delay": "0.15s" } as React.CSSProperties}>
          <p className="flex items-center gap-4">
            <span className="label text-gold">
              {category.index} · {category.eyebrow}
            </span>
            <span aria-hidden className="h-px w-10 bg-ink/25" />
          </p>
          <h1 className="caps-display mt-6 text-5xl sm:text-6xl xl:text-7xl 2xl:text-8xl">{category.title}</h1>
          <p className="mt-4 font-display text-2xl text-gold italic md:text-3xl">
            {category.headline}, {category.tagline}
          </p>
          <p className="mt-7 max-w-md text-sm leading-relaxed text-muted md:text-base">{category.description}</p>

          <div className="mt-10 grid max-w-sm grid-cols-2 gap-4">
            {[
              [albums.length, "Album"],
              [totalPhotos, "Ảnh"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-card px-6 py-5 shadow-soft">
                <p className="font-display text-4xl leading-none lining-nums">{value}</p>
                <p className="label mt-2 text-muted">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <a href="#albums" className="btn-pill">
              Xem album <ArrowIcon className="rotate-90" />
            </a>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="label border-b border-ink/30 pb-1 transition-colors hover:border-gold hover:text-gold"
            >
              Đặt lịch tư vấn
            </a>
          </div>
        </div>

        {hasMain && (
          <div
            className={`order-1 grid h-120 gap-3 sm:h-[clamp(480px,72vh,740px)] md:gap-4 lg:order-2 ${
              side.length ? "grid-cols-[1.35fr_1fr] grid-rows-2" : "grid-cols-1"
            }`}
          >
            <ViewTransition name={hasCover ? `cover-${category.slug}` : undefined} share="morph" default="none">
            <div className={`relative overflow-hidden bg-surface shadow-soft rounded-[1.75rem] ${side.length ? "row-span-2" : ""}`}>
              {hasCover ? (
                <Image
                  src={category.cover}
                  alt={category.title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 32vw, 90vw"
                  className="object-cover object-top"
                />
              ) : (
                mainPhoto && (
                  <PhotoImg
                    photo={mainPhoto}
                    eager
                    alt={category.title}
                    sizes="(min-width: 1024px) 32vw, 90vw"
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                )
              )}
            </div>
            </ViewTransition>
            {side.map((photo, i) => (
              <div
                key={photo.id}
                className={`${frame} rounded-2xl ${side.length === 1 ? "row-span-2" : ""}`}
                style={{ "--delay": `${0.12 * (i + 1)}s` } as React.CSSProperties}
              >
                <PhotoImg
                  photo={photo}
                  eager
                  sizes="(min-width: 1024px) 22vw, 50vw"
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
