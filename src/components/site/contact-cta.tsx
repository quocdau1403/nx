import { CATEGORIES, messengerUrl, type Category } from "@/lib/categories";
import { SITE } from "@/lib/site";
import { ArrowIcon } from "./arrow-icon";

/** Khối liên hệ cuối trang: lời mời bên trái, danh sách kênh liên hệ trong thẻ trắng bên phải. */
export function ContactCta({ category }: { category?: Category }) {
  return (
    <section className="mx-auto mt-28 max-w-350 px-5 md:px-10">
      <div className="grid gap-12 md:grid-cols-[1.15fr_1fr] md:items-center">
        <div>
          <p className="label text-gold">Ngọc Xinh Studio</p>
          <h2 className="caps-display mt-5 text-3xl md:text-4xl xl:text-5xl">
            Bạn muốn lưu giữ
            <br />
            khoảnh khắc nào?
          </h2>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
            Nhắn tin cho studio để được tư vấn concept, lịch chụp, trang phục và make up phù hợp với bạn.
          </p>
          <a href={messengerUrl(category)} target="_blank" rel="noopener noreferrer" className="btn-pill mt-9">
            Nhắn tin đặt lịch <ArrowIcon />
          </a>
        </div>

        <ul className="rounded-[1.75rem] bg-card px-6 py-3 shadow-soft md:px-10 md:py-5">
          {CATEGORIES.flatMap((c) =>
            c.facebook ? (
              <li key={c.slug} className="border-b border-line last:border-0">
                <a
                  href={c.facebook.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-6 py-6"
                >
                  <span>
                    <span className="label block text-muted">Fanpage {c.title}</span>
                    <span className="mt-2 block font-display text-2xl transition-colors group-hover:text-gold md:text-[1.7rem]">
                      {c.facebook.name}
                    </span>
                  </span>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line transition-colors duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
                    <ArrowIcon />
                  </span>
                </a>
              </li>
            ) : [],
          )}
          {SITE.hotline && (
            <li className="py-6">
              <span className="label block text-muted">Hotline</span>
              <a href={`tel:${SITE.hotline.replace(/\D/g, "")}`} className="mt-2 block font-display text-2xl hover:text-gold">
                {SITE.hotline}
              </a>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
