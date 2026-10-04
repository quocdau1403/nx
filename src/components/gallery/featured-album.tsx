import { ViewTransition } from "@/lib/view-transition";
import { ArrowIcon } from "@/components/site/arrow-icon";
import { TransitionLink } from "@/components/site/transition-link";
import type { AlbumSummary } from "@/lib/albums";
import { PhotoImg } from "./photo-img";

type Props = {
  album: AlbumSummary;
  eyebrow: string;
  description: string;
  categoryTitle: string;
  /** Đảo vị trí ảnh/chữ để các thẻ nổi bật xen kẽ */
  reverse?: boolean;
};

/** Thẻ ngang: nội dung một bên, ảnh cover một bên. */
export function FeaturedAlbum({ album, eyebrow, description, categoryTitle, reverse }: Props) {
  const href = `/${album.category}/${album.slug}`;
  return (
    <article className="grid overflow-hidden rounded-[1.75rem] bg-card shadow-soft md:grid-cols-[0.9fr_1.1fr]">
      <div className={`flex flex-col justify-center gap-6 p-8 md:p-14 ${reverse ? "md:order-2" : ""}`}>
        <p className="flex items-center gap-4">
          <span className="label text-gold">{eyebrow}</span>
          <span aria-hidden className="h-px w-10 bg-ink/25" />
        </p>
        <h3 className="caps-display text-4xl md:text-5xl">
          <TransitionLink href={href} type="nav-forward" className="transition-colors hover:text-gold">
            <ViewTransition name={`album-title-${album.id}`} share="text-morph" default="none">
              <span>{album.title}</span>
            </ViewTransition>
          </TransitionLink>
        </h3>
        <p className="max-w-md text-sm leading-relaxed text-muted">{description}</p>
        <p className="label flex gap-6 text-muted">
          <span>{album.count} ảnh</span>
          <span aria-hidden>·</span>
          <span>{categoryTitle}</span>
        </p>
        <div>
          <TransitionLink href={href} type="nav-forward" className="btn-pill">
            Xem album <ArrowIcon />
          </TransitionLink>
        </div>
      </div>
      <TransitionLink
        href={href}
        type="nav-forward"
        tabIndex={-1}
        aria-hidden
        className="group relative block min-h-[380px] overflow-hidden bg-surface md:min-h-[540px]"
      >
        {album.cover && (
          <PhotoImg
            photo={album.cover}
            eager
            sizes="(min-width: 768px) 55vw, 100vw"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-1400 ease-lux group-hover:scale-[1.03]"
          />
        )}
      </TransitionLink>
    </article>
  );
}
