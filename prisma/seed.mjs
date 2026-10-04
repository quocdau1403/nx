// Tạo (hoặc cập nhật) tài khoản admin từ biến môi trường.
// Chạy: npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = "Admin" } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
  console.error("Cần ADMIN_EMAIL và ADMIN_PASSWORD (≥ 8 ký tự) trong .env");
  process.exit(1);
}

const db = new PrismaClient();
const email = ADMIN_EMAIL.trim().toLowerCase();
const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

await db.user.upsert({
  where: { email },
  update: { role: "ADMIN", passwordHash, name: ADMIN_NAME },
  create: { email, name: ADMIN_NAME, passwordHash, role: "ADMIN" },
});

console.log(`Admin sẵn sàng: ${email}`);
await db.$disconnect();
