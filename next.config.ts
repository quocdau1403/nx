import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1080, 1440, 1920, 2560],
  },
  experimental: {
    // Bật <ViewTransition> của React cho chuyển trang mượt (fallback: trình duyệt cũ chuyển trang bình thường)
    viewTransition: true,
  },
};

export default nextConfig;
