import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import sharp from 'sharp';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const UPLOAD_DIR = path.resolve(process.cwd(), env.uploadDir);
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `tmp-${randomUUID()}`),
});

export const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(ApiError.badRequest('Hanya file gambar yang diizinkan'));
  },
});

/** Multer untuk media galeri: gambar + video (tanpa proses resize). */
export const uploadMedia = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^(image\/|video\/)/.test(file.mimetype)) cb(null, true);

    else cb(ApiError.badRequest('Hanya file gambar atau video yang diizinkan'));
  },
});

const VIDEO_EXT = { 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov' };

/**
 * Proses file media galeri: gambar → WebP (resize), video → simpan asli.
 * @returns {Promise<{url: string, mimeType: string}>}
 */
export async function processMediaFile(tmpPath, mimetype) {
  if (/^image\//.test(mimetype)) {
    const finalName = `${randomUUID()}.webp`;
    const finalPath = path.join(UPLOAD_DIR, finalName);
    try {
      await sharp(tmpPath).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(finalPath);
    } catch {
      fs.rmSync(tmpPath, { force: true });
      throw ApiError.badRequest('Gambar tidak valid atau rusak');
    }
    fs.rmSync(tmpPath, { force: true });
    return { url: `/uploads/${finalName}`, mimeType: 'image/webp' };
  }

  const ext = VIDEO_EXT[mimetype] || path.extname(tmpPath) || '.mp4';
  const finalName = `${randomUUID()}${ext}`;
  fs.renameSync(tmpPath, path.join(UPLOAD_DIR, finalName));
  return { url: `/uploads/${finalName}`, mimeType };
}

/**
 * Proses file hasil upload: resize landscape 1600×900 → WebP.
 * @returns {Promise<string>} url publik /uploads/...
 */
export async function processCoverImage(tmpPath) {
  const finalName = `${randomUUID()}.webp`;
  const finalPath = path.join(UPLOAD_DIR, finalName);

  try {
    await sharp(tmpPath)
      .resize(1600, 900, { fit: 'cover' })
      .webp({ quality: 82 })
      .toFile(finalPath);
  } catch (err) {
    fs.rmSync(tmpPath, { force: true });
    throw ApiError.badRequest('Gambar tidak valid atau rusak');
  }

  fs.rmSync(tmpPath, { force: true });
  return `/uploads/${finalName}`;
}

/** Hapus file upload (best effort). */
export function removeUploadFile(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const file = path.join(UPLOAD_DIR, path.basename(url));
  fs.rmSync(file, { force: true });
}
