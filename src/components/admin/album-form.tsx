"use client";

import { useActionState } from "react";
import { CATEGORIES } from "@/lib/categories";
import type { FormState } from "@/lib/form-state";

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  submitLabel: string;
  defaults?: { title: string; category: string; description: string | null };
};

export function AlbumForm({ action, submitLabel, defaults }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="grid gap-6 md:grid-cols-[1fr_240px_auto] md:items-end">
      <label className="block">
        <span className="label text-muted">Tên album</span>
        <input name="title" required maxLength={120} defaultValue={defaults?.title} className="field-input" />
      </label>
      <label className="block">
        <span className="label text-muted">Hạng mục</span>
        <select name="category" defaultValue={defaults?.category ?? CATEGORIES[0].slug} className="field-input">
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.title}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="label cursor-pointer border border-gold px-6 py-3.5 text-gold transition-colors hover:bg-gold hover:text-paper disabled:opacity-60"
      >
        {pending ? "Đang lưu…" : submitLabel}
      </button>
      <label className="block md:col-span-3">
        <span className="label text-muted">Mô tả (tuỳ chọn)</span>
        <textarea name="description" rows={2} maxLength={500} defaultValue={defaults?.description ?? ""} className="field-input resize-y" />
      </label>
      {state?.error && <p role="alert" className="text-sm text-red-700 md:col-span-3">{state.error}</p>}
      {state?.ok && <p className="text-sm text-gold md:col-span-3">Đã lưu.</p>}
    </form>
  );
}
