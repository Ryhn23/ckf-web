import app from './app.js';
import env from './config/env.js';
import prisma from './config/prisma.js';

const server = app.listen(env.port, () => {
  console.log(`🚀 CKF API berjalan di http://localhost:${env.port} (${env.nodeEnv})`);
});

// Graceful shutdown
async function shutdown(signal) {
  console.log(`\n${signal} diterima, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Fallback jika server macet
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
