// Next 15.5 với `experimental.viewTransition` dùng bản React experimental đi kèm, nơi API này
// vẫn mang tiền tố `unstable_`. Khi nâng lên bản có tên ổn định, chỉ cần đổi file này
// (và `unstable_addTransitionType` trong components/site/transition-link.tsx).
export { unstable_ViewTransition as ViewTransition } from "react";
