import Image from "next/image";
import { ViewTransition } from "@/lib/view-transition";
import { ArrowIcon } from "@/components/site/arrow-icon";
import { TransitionLink } from "@/components/site/transition-link";
import type { Category } from "@/lib/categories";

type Props = { category: Category; hasCover: boolean; delay: number };

/**
 * Khối hạng mục trên trang chủ. Hiệu ứng hover chỉ dùng transform/opacity (xem .panel-* trong globals.css):
 * ảnh khối đang rê thu về kích thước gốc, các khối còn lại tối đi.
 */
export function CategoryPanel({ category, hasCover, delay }: Props) {
  return (
    <TransitionLink
      href={`/${category.slug}`}
      type="nav-forward"
      style={{ "--delay": `${delay}s` } as React.CSSProperties}
      className={`panel panel-reveal group relative isolate flex min-h-[34svh] flex-1 overflow-hidden outline-none md:min-h-0
                 ${hasCover ? "bg-surface" : "bg-linear-to-b from-[#857a6f] to-[#5c534a]"}`}
    >
      {hasCover && (
        <ViewTransition name={`cover-${category.slug}`} share="morph" default="none">
          <Image
            src={category.cover}
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 45vw, 100vw"
            className="-z-20 object-cover object-[50%_22%] transition-transform duration-1600 ease-lux will-change-transform
                       pointer-fine:scale-[1.04] pointer-fine:group-hover:scale-100 group-focus-visible:scale-100"
          />
        </ViewTransition>
      )}
      {/* Lớp phủ nhẹ: chỉ tối ở đỉnh (cho header) và đáy (cho chữ) – phần giữa để ảnh nguyên bản */}
      <span aria-hidden className="absolute inset-0 -z-10 bg-linear-to-b from-shade/25 via-shade/0 via-40% to-shade/70 md:to-shade/60" />
      <span aria-hidden className="panel-dim absolute inset-0 -z-10 bg-shade" />

      {/* Toàn bộ chữ gom ở đáy khối, gọn và nhỏ để ảnh là trọng tâm */}
      <span className="flex w-full flex-col justify-end px-6 pb-8 text-ivory md:px-8 md:pb-20 xl:px-10">
        <span className="label flex items-center gap-3 text-ivory/75">
          <span className="font-display text-base tracking-normal text-gold-soft lining-nums">{category.index}</span>
          <span aria-hidden className="h-px w-6 bg-ivory/40" />
          {category.eyebrow}
        </span>
        <span className="caps-display mt-4 block text-[2rem] whitespace-nowrap sm:text-4xl md:text-[1.75rem] lg:text-[2.15rem] xl:text-[2.6rem] 2xl:text-5xl">
          {category.title}
        </span>
        <span className="label mt-5 inline-flex items-center gap-3 text-ivory/80 transition-colors duration-500 group-hover:text-ivory">
          Khám phá album
          <span
            className="flex size-8 items-center justify-center rounded-full border border-ivory/35 transition-colors duration-500
                       group-hover:border-gold-soft group-hover:bg-gold-soft group-hover:text-shade
                       group-focus-visible:border-gold-soft group-focus-visible:bg-gold-soft group-focus-visible:text-shade"
          >
            <ArrowIcon className="transition-transform duration-500 group-hover:translate-x-0.5" />
          </span>
        </span>
      </span>
    </TransitionLink>
  );
}
