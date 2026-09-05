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

echo "==> Menjalankan seeding data awal..."
node src/seed/seed.js

echo "==> Memulai aplikasi backend..."
exec "$@"
