import { ViewTransition } from "@/lib/view-transition";

/**
 * Hiệu ứng vào/ra của nội dung trang theo loại điều hướng (xem TransitionLink).
 * Đặt trong từng page, không đặt ở layout; header nằm ngoài để đứng yên khi chuyển trang.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", "nav-lateral": "fade-in", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", "nav-lateral": "fade-out", default: "none" }}
      default="none"
    >
      <div>{children}</div>
    </ViewTransition>
  );
}
