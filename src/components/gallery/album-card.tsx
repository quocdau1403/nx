import { ViewTransition } from "@/lib/view-transition";
import { ArrowIcon } from "@/components/site/arrow-icon";
import { TransitionLink, type NavType } from "@/components/site/transition-link";
import type { AlbumSummary } from "@/lib/albums";
import { PhotoImg } from "./photo-img";

type Props = { album: AlbumSummary; eyebrow: string; eager?: boolean; navType?: NavType };

/** Thẻ dọc: ảnh cover tràn thẻ, chữ phủ ở đáy. */
export function AlbumCard({ album, eyebrow, eager, navType = "nav-forward" }: Props) {
  return (
    <TransitionLink
      href={`/${album.category}/${album.slug}`}
      type={navType}
      className="group relative block aspect-3/4 overflow-hidden rounded-2xl bg-surface shadow-soft"
    >
      {album.cover && (
        <PhotoImg
          photo={album.cover}
          alt={album.title}
          eager={eager}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-1400 ease-lux group-hover:scale-105"
        />
      )}
      <span aria-hidden className="absolute inset-0 bg-linear-to-t from-shade/80 via-shade/10 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-6 text-ivory md:p-7">
        <span className="label block text-ivory/80">{eyebrow}</span>
        <ViewTransition name={`album-title-${album.id}`} share="text-morph" default="none">
          <span className="caps-display mt-3 block text-2xl md:text-[1.75rem]">{album.title}</span>
        </ViewTransition>
        <span className="mt-2 block text-sm text-ivory/80">{album.count} ảnh</span>
        <span className="label mt-5 inline-flex items-center gap-2">
          Xem album <ArrowIcon className="transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </span>
    </TransitionLink>
  );
}
