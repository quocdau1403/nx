import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getAdminSession, safeNext } from "@/lib/auth";

export const metadata = { title: "Đăng nhập quản trị" };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const next = safeNext((await searchParams).next || "/admin");
  if (await getAdminSession()) redirect(next);

  return (
    <AuthShell
      title="Quản trị"
      subtitle="Đăng nhập bằng tài khoản admin để quản lý album và tải ảnh lên."
      footer={
        <Link href="/" className="text-ink underline-offset-4 hover:underline">
          ← Về trang chủ
        </Link>
      }
    >
      <AuthForm next={next} action={login} />
    </AuthShell>
  );
}
