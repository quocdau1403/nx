"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession, destroySession, safeNext } from "@/lib/auth";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form-state";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// So sánh với hash giả khi email không tồn tại để thời gian phản hồi tương đương.
const DUMMY_HASH = "$2b$10$3qUQTZyWTlXQwGuQ93QDou3aIC6gGXsbpO5lucLvJx3Pd6NuXUBt2";

/** Chỉ admin cần đăng nhập; người xem duyệt ảnh tự do. */
export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!EMAIL.test(email) || !password) return { error: "Vui lòng nhập email và mật khẩu hợp lệ." };

  const user = await db.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || user.role !== "ADMIN") return { error: "Email hoặc mật khẩu không đúng." };

  await createSession(user);
  redirect(safeNext(form.get("next") || "/admin"));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
