"use client";

import { useState, useTransition } from "react";
import { syncFacebook } from "@/app/actions/admin";

type Props = { category: string; configured: boolean; pageUrl: string };

export function FacebookSyncButton({ category, configured, pageUrl }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function sync() {
    startTransition(async () => {
      const res = await syncFacebook(category);
      if (!res.ok) return setMessage(res.error);
      const { albums, photos, skipped, failed } = res.result;
      setMessage(
        `Xong: ${albums} album, +${photos} ảnh mới, ${skipped} ảnh đã có${failed ? `, ${failed} ảnh lỗi` : ""}.`,
      );
    });
  }

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <div className="flex items-center gap-5">
        <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="label text-muted transition-colors hover:text-ink">
          Fanpage ↗
        </a>
        <button
          type="button"
          onClick={sync}
          disabled={!configured || pending}
          className="label cursor-pointer border border-line px-4 py-2 transition-colors enabled:hover:border-gold enabled:hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Đang đồng bộ…" : "Đồng bộ từ Facebook"}
        </button>
      </div>
      {message && <p className="text-xs text-ink/80">{message}</p>}
    </div>
  );
}
