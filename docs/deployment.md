# Đưa website lên domain & hosting

Đề xuất cách đưa **Ngọc Xinh Studio** ra internet với tên miền riêng (ví dụ `ngocxinhstudio.vn`) và HTTPS.

> Giá, gói dịch vụ và giao diện quản trị của các nhà cung cấp thay đổi thường xuyên – kiểm tra lại trên trang của nhà cung cấp trước khi mua.

---

## 1. Website cần gì ở hosting

Ba đặc điểm của dự án quyết định loại hosting:

| Đặc điểm | Hệ quả |
|---|---|
| Database là **SQLite** – một file `prisma/dev.db` | Cần ổ đĩa **lưu lâu dài**, chỉ chạy **1 máy chủ** (không nhân bản nhiều instance) |
| Ảnh lưu trên ổ đĩa trong `storage/`, upload qua `/admin` | Ổ đĩa phải giữ file sau khi khởi động lại / triển khai lại |
| Cookie đăng nhập admin đặt cờ `secure` khi chạy `npm start` | **Bắt buộc HTTPS** – qua `http://` sẽ không đăng nhập admin được |

Ngoài ra cần: Node.js **≥ 20.9**, chạy tiến trình Node liên tục (`next start`), cho phép request upload **tối đa 40 MB/ảnh**.

---

## 2. So sánh lựa chọn

| Lựa chọn | Chạy được ngay? | Phù hợp khi | Ghi chú |
|---|---|---|---|
| **A. VPS (máy chủ ảo)** – Ubuntu + Node + Caddy | ✅ Không sửa code | **Đề xuất** cho dự án này | Toàn quyền, chi phí thấp, tự quản trị (cài đặt một lần theo mục 4) |
| **B. PaaS có ổ đĩa gắn kèm** (Railway, Render, Fly.io… với *volume/disk*) | ✅ Nếu gắn volume cho `prisma/` và `storage/` | Không muốn tự quản trị máy chủ | Bắt buộc dùng gói có persistent volume; thiếu volume → mất database + ảnh mỗi lần deploy |
| **C. Vercel / Netlify** (serverless) | ❌ Cần sửa code | Muốn CDN toàn cầu, không quản trị máy chủ | Ổ đĩa chỉ đọc/tạm thời → phải chuyển SQLite sang PostgreSQL (Neon, Supabase…) và ảnh sang object storage (Cloudinary, S3, Cloudflare R2) |
| **D. Shared hosting (cPanel)** | ⚠️ Tuỳ nhà cung cấp | Đã có sẵn gói hosting | Chỉ dùng nếu hỗ trợ ứng dụng Node.js ≥ 20.9 chạy liên tục và thư viện `sharp`; thường hạn chế RAM/upload – không khuyến khích |

### Đề xuất: **A. VPS**

- Website chạy nguyên trạng, giống hệt trên máy hiện tại.
- Chọn máy chủ đặt tại **Việt Nam hoặc Singapore** để khách xem ảnh nhanh (phần lớn khách ở Việt Nam).
- Ví dụ nhà cung cấp: trong nước (Viettel IDC, VNPT, BizFly Cloud, Vietnix, AZDIGI…) hoặc quốc tế có vùng Singapore (DigitalOcean, Vultr, AWS Lightsail, Linode/Akamai…).

### Cấu hình VPS tối thiểu

| Thành phần | Tối thiểu | Lý do |
|---|---|---|
| CPU | 1 vCPU (khuyên 2 vCPU) | Upload ảnh dùng `sharp` tạo 4 kích cỡ WebP – nhiều CPU xử lý nhanh hơn |
| RAM | **2 GB** | `npm run build` của Next.js dễ thiếu RAM với 1 GB (nếu chỉ có 1 GB, bật swap – mục 4.2) |
| Ổ đĩa | 25 GB SSD trở lên | Ảnh đã tối ưu trung bình **~0.3 MB/ảnh** (gồm 4 kích cỡ) → 10.000 ảnh ≈ 3 GB, cộng hệ điều hành + `node_modules` + bản sao lưu |
| Hệ điều hành | Ubuntu 22.04 hoặc 24.04 LTS | Các lệnh dưới đây viết cho Ubuntu |

---

## 3. Tên miền (domain)

| Đuôi | Mua ở đâu | Ghi chú |
|---|---|---|
| `.vn`, `.com.vn` | Nhà đăng ký tên miền được VNNIC công nhận (Mắt Bão, PA Vietnam, Nhân Hòa…) | Cần thông tin chủ thể (cá nhân/doanh nghiệp) khi đăng ký |
| `.com`, `.studio`… | Cloudflare Registrar, Namecheap, Porkbun… hoặc các nhà đăng ký trong nước | |

Sau khi có VPS (biết **địa chỉ IP**), vào trang quản lý DNS của tên miền và tạo bản ghi:

| Loại | Tên (Host) | Giá trị | TTL |
|---|---|---|---|
| `A` | `@` | `<IP của VPS>` | Mặc định |
| `A` | `www` | `<IP của VPS>` | Mặc định |

DNS có thể mất vài phút đến vài giờ để cập nhật. Kiểm tra: `nslookup ngocxinhstudio.vn` trả về đúng IP.

---

## 4. Triển khai lên VPS (Ubuntu)

Các lệnh chạy qua SSH: `ssh root@<IP của VPS>` (Windows 10/11 có sẵn lệnh `ssh` trong PowerShell).

### 4.1. Tạo người dùng riêng, bật tường lửa

```bash
adduser ngocxinh
usermod -aG sudo ngocxinh
ufw allow OpenSSH
ufw allow 80,443/tcp
ufw enable
```

Từ đây đăng nhập bằng `ssh ngocxinh@<IP>`. Không mở cổng 3000 ra ngoài – chỉ Caddy (cổng 80/443) truy cập vào.

### 4.2. Cài Node.js, công cụ cần thiết (và swap nếu RAM 1 GB)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs sqlite3 unzip
node -v        # ≥ v20.9.0
sudo npm install -g pm2

# Chỉ khi VPS có 1 GB RAM:
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 4.3. Đưa mã nguồn + dữ liệu lên máy chủ

Trên máy Windows, đóng gói theo [setup.md – mục 2](setup.md#2-những-gì-cần-chép) (bỏ `node_modules`, `.next`), rồi gửi lên:

```powershell
robocopy "D:\WebVL" "D:\deploy\WebVL" /E /XD node_modules .next "Ngọc Xinh Studio" /XF tsconfig.tsbuildinfo next-env.d.ts .env
Compress-Archive -Path "D:\deploy\WebVL\*" -DestinationPath "D:\deploy\ngocxinh.zip" -Force
scp "D:\deploy\ngocxinh.zip" ngocxinh@<IP>:/home/ngocxinh/
```

Trên VPS:

```bash
sudo mkdir -p /srv/ngocxinh && sudo chown ngocxinh:ngocxinh /srv/ngocxinh
unzip ~/ngocxinh.zip -d /srv/ngocxinh
cd /srv/ngocxinh
npm ci
```

> Gói gửi lên đã gồm `prisma/dev.db` và `storage/` → website lên mạng với đầy đủ album hiện có.

### 4.4. Tạo `.env` cho môi trường thật

**Không dùng lại** `.env` của máy cá nhân. Tạo mới trên VPS:

```bash
cd /srv/ngocxinh
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # → dán vào AUTH_SECRET
nano .env
```

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="<chuỗi vừa sinh>"
ADMIN_EMAIL="<email admin thật>"
ADMIN_PASSWORD="<mật khẩu mạnh, ≥ 12 ký tự>"
ADMIN_NAME="Ngọc Xinh"
STORAGE_DIR="storage"
```

```bash
chmod 600 .env
npm run db:seed      # tạo/cập nhật tài khoản admin theo .env
npm run build
```

### 4.5. Chạy nền bằng PM2 (tự khởi động lại khi lỗi / khi VPS reboot)

```bash
cd /srv/ngocxinh
pm2 start npm --name ngocxinh -- start -- -H 127.0.0.1 -p 3000
pm2 save
pm2 startup          # chạy tiếp dòng lệnh mà PM2 in ra
```

`-H 127.0.0.1` để Node chỉ nhận kết nối nội bộ từ Caddy. Kiểm tra: `pm2 status`, `pm2 logs ngocxinh`.

### 4.6. Caddy: HTTPS tự động + trỏ domain vào website

Caddy tự xin và gia hạn chứng chỉ HTTPS miễn phí (Let's Encrypt).

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
sudo nano /etc/caddy/Caddyfile
```

Nội dung `/etc/caddy/Caddyfile` (thay tên miền):

```caddy
ngocxinhstudio.vn, www.ngocxinhstudio.vn {
	encode zstd gzip

	# Ảnh upload tối đa 40 MB/ảnh (MAX_UPLOAD_BYTES) – chừa dư cho phần form
	request_body {
		max_size 50MB
	}

	reverse_proxy 127.0.0.1:3000
}
```

```bash
sudo systemctl reload caddy
```

Mở `https://ngocxinhstudio.vn` – có ổ khoá HTTPS là xong.

<details>
<summary>Dùng Nginx thay cho Caddy</summary>

```nginx
server {
    server_name ngocxinhstudio.vn www.ngocxinhstudio.vn;
    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Sau đó cấp HTTPS: `sudo apt install -y certbot python3-certbot-nginx && sudo certbot --nginx`.
`client_max_body_size` là bắt buộc – mặc định của Nginx (1 MB) sẽ chặn upload ảnh.

</details>

---

## 5. Kiểm tra sau khi lên mạng

| Kiểm tra | Kết quả đúng |
|---|---|
| `https://<domain>` | Có ổ khoá HTTPS, trang chủ hiện 3 khối hạng mục |
| `http://<domain>` | Tự chuyển sang `https://` |
| `https://www.<domain>` | Mở được |
| Mở album, bấm ảnh | Ảnh nét, trình xem toàn màn hình hoạt động |
| `/admin` → đăng nhập | Vào được trang quản trị (nếu không vào được: kiểm tra đang dùng **https**) |
| Upload 1 ảnh ~20 MB trong `/admin` | Thành công (lỗi `413` → kiểm tra `max_size` / `client_max_body_size`) |
| Mở trên điện thoại bằng 4G | Tải nhanh, bố cục đúng |

---

## 6. Cập nhật website sau này

```bash
# 1. Sao lưu trước khi cập nhật (mục 7)
# 2. Chép mã nguồn mới lên – KHÔNG ghi đè prisma/dev.db, storage/, .env trên VPS
cd /srv/ngocxinh
npm ci
npx prisma db push      # chỉ cần khi prisma/schema.prisma thay đổi
npm run build
pm2 restart ngocxinh
```

Khi gửi bản cập nhật, chỉ gửi: `src/`, `public/`, `scripts/`, `package.json`, `package-lock.json`, các file cấu hình. Ảnh và album trên website thật là dữ liệu sống – admin có thể đã upload thêm.

---

## 7. Sao lưu tự động

Dữ liệu cần giữ: `prisma/dev.db` (album, thứ tự ảnh, tài khoản), `storage/` (ảnh), `.env`.

```bash
mkdir -p /srv/ngocxinh/backups
crontab -e
```

Thêm dòng (chạy lúc 3h sáng mỗi ngày, giữ 14 ngày gần nhất):

```cron
0 3 * * * cd /srv/ngocxinh && sqlite3 prisma/dev.db ".backup backups/db-$(date +\%F).db" && tar -czf backups/storage-$(date +\%F).tar.gz storage .env && find backups -mtime +14 -delete
```

`sqlite3 .backup` sao lưu an toàn ngay cả khi website đang chạy. Định kỳ tải thư mục `backups/` về máy cá nhân hoặc lưu lên Google Drive – bản sao lưu nằm cùng VPS sẽ mất nếu VPS hỏng.

---

## 8. Bảo mật – việc nên làm

| Việc | Lý do |
|---|---|
| `AUTH_SECRET` mới, `ADMIN_PASSWORD` mạnh trên VPS | Không dùng lại thông tin của máy cá nhân |
| Chỉ mở cổng 22, 80, 443 (`ufw`) | Cổng 3000 không lộ ra internet |
| Đăng nhập SSH bằng khoá thay vì mật khẩu | Chống dò mật khẩu SSH |
| `sudo apt update && sudo apt upgrade` hằng tháng | Vá lỗi hệ điều hành |
| Trang đăng nhập **chưa giới hạn số lần thử sai** | Nên bổ sung trước khi công khai rộng rãi, hoặc đặt Cloudflare phía trước để chặn truy cập bất thường |
| (Tuỳ chọn) Cloudflare làm DNS + proxy | CDN cache ảnh (`/api/photos/...` đã gửi `Cache-Control: public, max-age=31536000, immutable`), ẩn IP VPS, chống DDoS. Bật chế độ SSL **Full (strict)** |

---

## 9. Nếu sau này muốn dùng Vercel (lựa chọn C)

Cần thay đổi code trước khi deploy:

1. `prisma/schema.prisma`: `provider = "postgresql"`, `DATABASE_URL` trỏ tới PostgreSQL (Neon, Supabase, Vercel Postgres…); chuyển dữ liệu từ `dev.db` sang.
2. `src/lib/photos.ts` + `src/app/api/photos/[id]/[size]/route.ts`: ghi/đọc ảnh từ object storage (Cloudinary, S3, Cloudflare R2…) thay vì thư mục `storage/`; tải lên các ảnh hiện có.
3. Kiểm tra giới hạn kích thước request upload của gói Vercel đang dùng; nếu nhỏ hơn 40 MB, đổi sang upload trực tiếp từ trình duyệt lên object storage (signed URL).

Đây là thay đổi kiến trúc – cần làm và kiểm thử riêng, không nằm trong phạm vi hiện tại.
