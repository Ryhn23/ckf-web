import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export function notFound(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} tidak ditemukan`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Terjadi kesalahan pada server';

  // Prisma: unique constraint violation
  if (err.code === 'P2002') {
    status = 409;
    message = 'Data sudah ada (nilai unik bentrok)';
  }
  // Prisma: record tidak ditemukan
  if (err.code === 'P2025') {
    status = 404;
    message = 'Data tidak ditemukan';
  }
  // JSON body invalid
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Body JSON tidak valid';
  }
  // Multer errors
  if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? `Ukuran file melebihi ${env.maxUploadMb}MB` : `Gagal upload: ${err.message}`;
  }

  if (status >= 500) console.error(err);

  res.status(status).json({
    error: {
      code: status,
      message,
      ...(env.isProd ? {} : { stack: err.stack }),
    },
  });
}
