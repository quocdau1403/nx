import Image from "next/image";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { CATEGORIES } from "@/lib/categories";

type Props = { title: string; subtitle: string; footer: React.ReactNode; children: React.ReactNode };

export function AuthShell({ title, subtitle, footer, children }: Props) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-surface lg:block">
        <Image src={CATEGORIES[1].cover} alt="" fill priority sizes="50vw" className="object-cover" />
        <span aria-hidden className="absolute inset-0 bg-linear-to-t from-shade/40 to-transparent" />
      </div>

      <div className="flex flex-col px-6 py-8 md:px-16">
        <Link href="/" aria-label="Trang chủ" className="self-start">
          <Wordmark />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-16">
          <h1 className="caps-display text-4xl md:text-5xl">{title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">{subtitle}</p>
          <div className="mt-12">{children}</div>
          <p className="mt-10 text-sm text-muted">{footer}</p>
        </div>
      </div>
    </main>
  );
}
