# Cài đặt & chuyển dự án sang máy khác

Hướng dẫn mang nguyên thư mục **Ngọc Xinh Studio** sang một máy khác và chạy lại với đầy đủ album, ảnh và tài khoản admin.

---

## 1. Yêu cầu trên máy mới

| Thành phần | Phiên bản | Ghi chú |
|---|---|---|
| **Node.js** | **≥ 20.9** (khuyên dùng bản LTS mới nhất) | Tải tại <https://nodejs.org>. `sharp` (xử lý ảnh) yêu cầu tối thiểu 20.9 |
| **npm** | đi kèm Node.js | |
| **Internet** | cần ở lần cài đầu tiên | `npm ci` tải thư viện (gồm `sharp`, Prisma engine theo hệ điều hành); `npm run build` tải font Google (Cormorant Garamond, Be Vietnam Pro) |

Kiểm tra:

```powershell
node -v    # phải ≥ v20.9.0
npm -v
```

Không cần cài database riêng: dự án dùng **SQLite** (một file `prisma/dev.db`).

---

## 2. Những gì cần chép

### Chép

| Đường dẫn | Nội dung | Bắt buộc |
|---|---|---|
| `src/`, `public/`, `scripts/` | Mã nguồn, logo, ảnh nền hạng mục, lệnh nhập ảnh | ✅ |
| `prisma/` | `schema.prisma`, `seed.mjs` và **`dev.db` (database: album, ảnh, tài khoản)** | ✅ |
| `storage/` | **Toàn bộ ảnh đã tối ưu** (WebP nhiều kích cỡ) | ✅ |
| `package.json`, `package-lock.json` | Danh sách thư viện + phiên bản đã khoá | ✅ |
| `next.config.ts`, `tsconfig.json`, `postcss.config.mjs` | Cấu hình | ✅ |
| `.env` | Khoá bí mật + tài khoản admin | Tuỳ chọn – xem mục 4 |
| `.env.example`, `README.md`, `docs/` | Mẫu cấu hình, tài liệu | Nên chép |
| `Ngọc Xinh Studio/` | Ảnh gốc dùng để nhập (~45 MB) | Không bắt buộc – web không đọc thư mục này |

> ⚠️ **`prisma/dev.db` và `storage/` phải đi cùng nhau.** Database chỉ lưu thông tin ảnh; file ảnh nằm trong `storage/photos/<id>/`. Thiếu một trong hai → album trống hoặc ảnh lỗi 404.

### Không chép

| Đường dẫn | Lý do |
|---|---|
| `node_modules/` (~700 MB) | Chứa file nhị phân riêng cho từng hệ điều hành (`sharp`, Prisma). Chép sang máy khác dễ lỗi → cài lại bằng `npm ci` |
| `.next/` | Bản build tạm, tự tạo lại |
| `tsconfig.tsbuildinfo`, `next-env.d.ts` | Tự sinh |

### Lệnh chép (Windows PowerShell)

**Dừng server trước** (Ctrl+C ở terminal đang chạy `npm run dev`) để database không bị ghi dở.

```powershell
# Chép sang ổ USB / thư mục khác, bỏ qua các thư mục không cần
robocopy "D:\WebVL" "E:\WebVL" /E /XD node_modules .next "Ngọc Xinh Studio" /XF tsconfig.tsbuildinfo next-env.d.ts
```

`robocopy` trả mã 0–7 là thành công. Muốn gửi qua mạng thì nén thư mục vừa chép:

```powershell
Compress-Archive -Path "E:\WebVL\*" -DestinationPath "E:\ngoc-xinh-studio.zip"
```

macOS / Linux:

```bash
rsync -a --exclude node_modules --exclude .next --exclude "Ngọc Xinh Studio" ./ /duong-dan-dich/WebVL/
```

---

## 3. Cài trên máy mới

Mở terminal tại thư mục dự án đã chép:

```powershell
cd E:\WebVL
npm ci
```

`npm ci` cài đúng phiên bản trong `package-lock.json` và tự chạy `prisma generate`.

> Không nâng `typescript` lên bản 7 – Next.js 15 hiện không đọc được `next.config.ts` với TypeScript 7. `npm ci` giữ đúng bản 5.x đã khoá.

---

## 4. Cấu hình `.env`

### Cách A – Đã chép `.env` từ máy cũ

Không cần làm gì. Tài khoản admin và đăng nhập giữ nguyên như máy cũ.

### Cách B – Tạo `.env` mới (khuyên dùng khi chuyển cho người khác)

```powershell
Copy-Item .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Mở `.env`, điền:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="<chuỗi vừa sinh, ≥ 32 ký tự>"
ADMIN_EMAIL="admin@ngocxinh.local"
ADMIN_PASSWORD="<mật khẩu mới, ≥ 8 ký tự>"
ADMIN_NAME="Ngọc Xinh"
STORAGE_DIR="storage"
```

Sau đó cập nhật tài khoản admin trong database:

```powershell
npm run db:seed
```

Lệnh này tạo admin nếu chưa có, hoặc **đặt lại mật khẩu** nếu email đã tồn tại. Album và ảnh không bị ảnh hưởng.

> `.env` chứa mật khẩu và khoá bí mật – không gửi công khai, không đưa lên git (đã có trong `.gitignore`).

### Bắt đầu với database trống (không chép `dev.db`, `storage/`)

```powershell
npm run setup    # tạo prisma/dev.db + tài khoản admin từ .env
```

Rồi nhập ảnh lại – xem mục 7.

---

## 5. Chạy website

### Chế độ phát triển (sửa code, tự tải lại)

```powershell
npm run dev
```

Mở <http://localhost:3000>.

### Chế độ chạy thật (nhanh hơn, dùng khi cho khách xem)

```powershell
npm run build
npm start
```

Đổi cổng nếu 3000 đã bị dùng:

```powershell
npm run dev -- -p 3001
npm start -- -p 3001
```

### Cho máy khác trong cùng mạng truy cập

`npm start` / `npm run dev` mặc định lắng nghe mọi địa chỉ (`0.0.0.0`).

1. Xem IP máy chạy web: `ipconfig` → dòng **IPv4 Address** (ví dụ `192.168.1.20`).
2. Cho phép cổng 3000 qua tường lửa Windows (PowerShell **Run as Administrator**):

   ```powershell
   New-NetFirewallRule -DisplayName "Ngoc Xinh Studio 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
   ```

3. Trên điện thoại/máy khác cùng Wi-Fi mở `http://192.168.1.20:3000`.

> **Đăng nhập admin qua mạng LAN:** với `npm start` (chế độ chạy thật), cookie đăng nhập chỉ hoạt động qua **HTTPS** hoặc `http://localhost`. Mở bằng `http://192.168.1.20:3000` vẫn xem ảnh được nhưng **không đăng nhập `/admin` được** – hãy quản trị ngay trên máy chạy web (`http://localhost:3000`), hoặc chạy `npm run dev` khi cần quản trị từ máy khác trong mạng.

---

## 6. Kiểm tra sau khi cài

| Kiểm tra | Kết quả đúng |
|---|---|
| Mở `/` | Logo hiện dần, 3 khối Ảnh cưới · Make up · Ảnh concept có ảnh nền |
| Mở `/make-up` | Có album và số ảnh (ví dụ 8 album · 49 ảnh) |
| Mở một album, bấm vào ảnh | Ảnh hiện nét, mở được trình xem toàn màn hình |
| Mở `/admin` | Chuyển sang trang đăng nhập; đăng nhập bằng `ADMIN_EMAIL` / `ADMIN_PASSWORD` |
| Trong `/admin`, upload thử 1 ảnh | Ảnh xuất hiện trong lưới, kéo thả đổi thứ tự được |

---

## 7. Nhập thêm ảnh từ thư mục

```powershell
npm run import -- "<thư mục>" <anh-cuoi | make-up | concept>
```

- Mỗi **thư mục con** = một album (tên thư mục = tên album).
- Ảnh nằm trực tiếp trong `<thư mục>` → một album mang tên chính thư mục đó.
- Chạy lại an toàn: ảnh đã nhập được bỏ qua.
- Ảnh nền 3 khối trang chủ: đặt `anh-cuoi.jpg`, `make-up.jpg`, `concept.jpg` (ảnh dọc, ≥ 1300 px chiều ngang) vào `public/images/categories/`.

---

## 8. Sao lưu

Ba thứ cần giữ để khôi phục toàn bộ website:

```text
prisma/dev.db     ← album, thứ tự ảnh, tài khoản
storage/          ← file ảnh
.env              ← khoá bí mật, tài khoản admin
```

Dừng server trước khi sao lưu `dev.db`.

---

## 9. Lỗi thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Could not load the "sharp" module` | `node_modules` chép từ máy/hệ điều hành khác | Xoá `node_modules`, chạy `npm ci` |
| `@prisma/client did not initialize yet` | Chưa sinh Prisma Client | `npx prisma generate` |
| `AUTH_SECRET trong .env phải dài tối thiểu 32 ký tự` | Thiếu hoặc sai `.env` | Làm lại mục 4 |
| Trang báo lỗi 500 / `EPERM ... .next` | Chạy `npm run build` khi `npm run dev` đang chạy | Dừng server → `Remove-Item -Recurse -Force .next` → chạy lại |
| Album trống, ảnh 404 | Thiếu `storage/` hoặc `dev.db` không khớp `storage/` | Chép lại cả hai từ cùng một thời điểm |
| `Failed to fetch font` khi build | Không có internet | Kết nối mạng rồi build lại |
| `EADDRINUSE: address already in use :::3000` | Cổng đang bị chiếm | Dùng `-p 3001` (mục 5) |
| Không đăng nhập được admin | Sai mật khẩu hoặc `.env` mới | Sửa `ADMIN_PASSWORD` trong `.env` → `npm run db:seed` |
| Máy khác trong mạng không mở được | Tường lửa chặn cổng | Mở cổng (mục 5) |

---

## 10. Đưa website lên domain & hosting

Xem [deployment.md](deployment.md): lựa chọn hosting phù hợp (đề xuất VPS), mua tên miền và trỏ DNS, cài HTTPS, chạy nền bằng PM2, sao lưu tự động, cập nhật phiên bản và các việc bảo mật cần làm.
