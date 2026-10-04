"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { unstable_addTransitionType as addTransitionType, startTransition, type ComponentProps } from "react";

/** nav-forward: đi sâu hơn · nav-back: quay lên · nav-lateral: sang trang ngang hàng */
export type NavType = "nav-forward" | "nav-back" | "nav-lateral";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string; type: NavType };

/**
 * Link điều hướng trong một View Transition có gắn loại chuyển động.
 * Ctrl/Cmd+click, mở tab mới… vẫn hoạt động như link thường (onNavigate không chạy).
 */
export function TransitionLink({ href, type, ...props }: Props) {
  const router = useRouter();
  return (
    <Link
      href={href}
      {...props}
      onNavigate={(e) => {
        e.preventDefault();
        startTransition(() => {
          addTransitionType(type);
          router.push(href);
        });
      }}
    />
  );
}
