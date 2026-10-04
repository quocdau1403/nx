# Ngọc Xinh Studio

Portfolio/gallery cho studio: Ảnh cưới · Make up · Ảnh concept.

**Stack:** Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · Prisma + PostgreSQL (Neon) · Vercel Blob · sharp · jose (JWT cookie) · dnd-kit

Deploy lên Vercel: xem [docs/deployment.md §9](docs/deployment.md#9-deploy-lên-vercel-lựa-chọn-c--code-hiện-tại-đã-hỗ-trợ).

## Cài đặt

```bash
npm install
cp .env.example .env      # điền DATABASE_URL(+_UNPOOLED), BLOB_READ_WRITE_TOKEN, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run setup             # tạo database + tài khoản admin
npm run dev               # http://localhost:3000
```

Yêu cầu Node.js ≥ 20.9. Chuyển dự án sang máy khác, chạy cho máy trong mạng LAN, sao lưu và xử lý lỗi: xem [docs/setup.md](docs/setup.md). Đưa lên tên miền + hosting (HTTPS, VPS, sao lưu): xem [docs/deployment.md](docs/deployment.md).

Ảnh nền 3 hạng mục ở trang chủ: đặt `anh-cuoi.jpg`, `make-up.jpg`, `concept.jpg` vào `public/images/categories/`.

## Phân quyền

| Vai trò | Quyền |
|---|---|
| Người xem (không cần tài khoản) | Xem toàn bộ danh mục, album, ảnh |
| Admin (`npm run db:seed`, đăng nhập tại `/admin`) | Tạo/sửa/xoá album theo từng hạng mục, bulk upload, kéo thả sắp xếp, đặt cover, xoá ảnh, đồng bộ Facebook |

Ảnh gốc được tối ưu thành WebP 480/960/1600/2400px và lưu trên Vercel Blob (`photos/<id>/<w>.webp`), phục vụ thẳng qua CDN.

## Nhập ảnh từ thư mục

```bash
npm run import -- <thư mục> <anh-cuoi | make-up | concept>
```

Mỗi thư mục con thành một album (tên thư mục = tên album); ảnh sắp theo tên file. Chạy lại an toàn: ảnh đã nhập được bỏ qua.

## Đồng bộ ảnh từ Facebook Page

Mỗi hạng mục gắn với một fanpage (xem `src/lib/categories.ts`). Để bật nút **Đồng bộ từ Facebook** trong `/admin`:

1. Quản trị viên fanpage tạo app tại <https://developers.facebook.com/>.
2. Dùng Graph API Explorer lấy **Page Access Token** cho từng fanpage (quyền đọc nội dung page).
3. Điền vào `.env`: `FB_TOKEN_ANH_CUOI`, `FB_TOKEN_MAKE_UP`, `FB_TOKEN_CONCEPT`, rồi khởi động lại server.

Đồng bộ có thể chạy lại: ảnh đã tải về sẽ được bỏ qua. Album ảnh đại diện và ảnh bìa của page không được nhập.
