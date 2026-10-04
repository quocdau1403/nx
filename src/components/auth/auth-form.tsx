"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form-state";

type Props = {
  next: string;
  action: (state: FormState, form: FormData) => Promise<FormState>;
};

export function AuthForm({ next, action }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="label text-muted">Email</span>
        <input name="email" type="email" required autoComplete="email" className="field-input" />
      </label>
      <label className="block">
        <span className="label text-muted">Mật khẩu</span>
        <input name="password" type="password" required autoComplete="current-password" className="field-input" />
      </label>

      {state?.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="label mt-2 cursor-pointer border border-gold px-6 py-4 text-gold transition-colors duration-300 hover:bg-gold hover:text-paper disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Đang xử lý…" : "Đăng nhập"}
      </button>
    </form>
  );
}
