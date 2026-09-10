#!/bin/sh
set -e

echo "==> Menunggu database PostgreSQL siap..."

node -e '
import net from "node:net";
const url = new URL(process.env.DATABASE_URL);
const host = url.hostname;
const port = Number(url.port) || 5432;
let retries = 30;

function check() {
  const socket = net.createConnection(port, host, () => {
    console.log("==> Terhubung ke PostgreSQL di " + host + ":" + port);
    socket.end();
    process.exit(0);
  });
  socket.on("error", (err) => {
    retries--;
    if (retries <= 0) {
      console.error("==> Gagal terhubung ke database:", err.message);
      process.exit(1);
    }
    setTimeout(check, 1000);
  });
}
check();
'

echo "==> Menyiapkan skema database..."
npx prisma db push --skip-generate

if [ "$AUTO_SEED" = "true" ]; then
  echo "==> Menjalankan seeding data awal (AUTO_SEED=true)..."
  node src/seed/seed.js
else
  echo "==> Memastikan akun admin tersedia..."
  node -e '
    import prisma from "./src/config/prisma.js";
    import bcrypt from "bcryptjs";
    import env from "./src/config/env.js";
    async function check() {
      const email = env.adminEmail || "admin@ckf.or.id";
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        const passwordHash = await bcrypt.hash(env.adminPassword || "admin123", 10);
        await prisma.user.create({
          data: {
            name: "Administrator",
            email,
            passwordHash,
            role: "SUPERADMIN",
          },
        });
        console.log("==> Akun admin default dibuat:", email);
      }
    }
    check().catch(console.error).finally(() => prisma.$disconnect());
  '
fi

echo "==> Memulai aplikasi backend..."
exec "$@"
