// Kiểu cho các export `unstable_` của React experimental mà Next.js đi kèm (xem src/lib/view-transition.ts).
import "react";

declare module "react" {
  export const unstable_ViewTransition: typeof ViewTransition;
  export const unstable_addTransitionType: typeof addTransitionType;
}
