import fs from 'node:fs';
import path from 'node:path';
import prisma from '../config/prisma.js';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { processMediaFile } from '../middlewares/upload.js';

const UPLOAD_DIR = path.resolve(process.cwd(), env.uploadDir);

/** POST /api/media/upload (admin, multipart) */
export const upload = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw ApiError.badRequest('File wajib dilampirkan');

  const { url, mimeType } = await processMediaFile(file.path, file.mimetype);
  const media = await prisma.media.create({
    data: {
      url,
      originalName: file.originalname,
      size: fs.statSync(path.join(UPLOAD_DIR, path.basename(url))).size,
      mimeType,
      uploadedById: req.user.id,
    },
  });

  res.status(201).json({ data: media });
});

/** GET /api/media */
export const list = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 50);

  const [total, data] = await Promise.all([
    prisma.media.count(),
    prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { uploadedBy: { select: { name: true } } },
    }),
  ]);

  res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

/** GET /api/media/public (publik — untuk halaman galeri) */
export const listPublic = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 24, 1), 50);

  const [total, data] = await Promise.all([
    prisma.media.count(),
    prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

/** DELETE /api/media/:id (admin) */
export const remove = asyncHandler(async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } });
  if (!media) throw ApiError.notFound('Media tidak ditemukan');

  // Jangan hapus file yang sedang dipakai sebagai cover post
  const usedAsCover = await prisma.post.count({ where: { coverImage: media.url } });
  let fileRemoved = false;
  if (usedAsCover === 0) {
    fs.rmSync(path.join(UPLOAD_DIR, path.basename(media.url)), { force: true });
    fileRemoved = true;
  }

  await prisma.media.delete({ where: { id: media.id } });
  res.json({ message: 'Media dihapus', fileRemoved });
});
