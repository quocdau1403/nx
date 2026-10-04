import { SITE } from "./site";

export type FacebookPage = {
  url: string;
  /** Tên hiển thị của fanpage. */
  name: string;
  label: string;
  /** Tên biến môi trường chứa Page Access Token của fanpage. */
  tokenEnv: string;
};

export type Category = {
  slug: string;
  index: string;
  title: string;
  eyebrow: string;
  description: string;
  /** Tiêu đề lớn + dòng chữ nghiêng ở phần giới thiệu trang danh mục. */
  headline: string;
  tagline: string;
  /** Ảnh nền cổng trang chủ (public). Thay bằng ảnh thật của studio, tỷ lệ dọc, ≥ 2000px. */
  cover: string;
  /** Fanpage nguồn để đồng bộ ảnh. Không có = admin chỉ upload thủ công. */
  facebook?: FacebookPage;
};

export const CATEGORIES: readonly Category[] = [
  {
    slug: "anh-cuoi",
    index: "01",
    title: "Ảnh cưới",
    eyebrow: "Wedding Photography",
    description:
      "Lưu giữ câu chuyện tình yêu qua ống kính tinh tế, tối giản và trọn vẹn cảm xúc tự nhiên.",
    headline: "Câu chuyện tình yêu",
    tagline: "kể bằng ánh sáng tự nhiên",
    cover: "/images/categories/anh-cuoi.jpg",
    facebook: {
      url: "https://www.facebook.com/ngocxinh.studio/",
      name: "Ngọc Xinh Studio",
      label: "Studio",
      tokenEnv: "FB_TOKEN_ANH_CUOI",
    },
  },
  {
    slug: "make-up",
    index: "02",
    title: "Make up",
    eyebrow: "Bridal & Beauty",
    description:
      "Nét đẹp trong trẻo, lớp nền mỏng nhẹ tự nhiên – phong cách trang điểm cho cô dâu hiện đại.",
    headline: "Vẻ đẹp trong trẻo",
    tagline: "tôn vinh nét riêng của bạn",
    cover: "/images/categories/make-up.jpg",
    facebook: {
      url: "https://www.facebook.com/ngocxinhmakeupacademy/",
      name: "Ngọc Xinh Make Up - Academy",
      label: "Makeup",
      tokenEnv: "FB_TOKEN_MAKE_UP",
    },
  },
  {
    slug: "concept",
    index: "03",
    title: "Ảnh concept",
    eyebrow: "Fine Art Concept",
    description:
      "Không gian sáng tạo độc bản, nơi ánh sáng và cảm hứng nghệ thuật giao thoa trong từng khung hình.",
    headline: "Nghệ thuật độc bản",
    tagline: "cho từng khung hình",
    cover: "/images/categories/concept.jpg",
    facebook: {
      url: "https://www.facebook.com/ngocxinhconcept/",
      name: "Ngọc Xinh Concept",
      label: "Concept",
      tokenEnv: "FB_TOKEN_CONCEPT",
    },
  },
];

export function getCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

/** Link Messenger của fanpage hạng mục (m.me/<tên page>); mặc định là fanpage studio. */
export function messengerUrl(category?: Category) {
  const page = category?.facebook?.url.match(/facebook\.com\/([^/?#]+)/)?.[1];
  return page ? `https://m.me/${page}` : SITE.bookingUrl;
}
