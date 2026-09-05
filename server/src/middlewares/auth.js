import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export const TOKEN_COOKIE = 'ckf_token';

/**
 * Verifikasi JWT dari cookie → req.user.
 * Route publik tidak memakai middleware ini.
 */
export async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.[TOKEN_COOKIE];
    if (!token) throw ApiError.unauthorized('Sesi tidak ditemukan, silakan login');

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, avatar: true },
    });
    if (!user) throw ApiError.unauthorized('User tidak lagi tersedia');

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized('Sesi tidak valid, silakan login ulang'));
  }
}

/**
 * Autentikasi opsional: isi req.user jika cookie valid,
 * lanjut anonim jika tidak (untuk route publik yang punya privilege admin).
 */
export async function optionalAuth(req, res, next) {
  const token = req.cookies?.[TOKEN_COOKIE];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, avatar: true },
    });
    if (user) req.user = user;
  } catch {
    // Token tidak valid / kedaluwarsa → lanjut sebagai anonim
  }
  next();
}

export function signToken(user) {
  return jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: env.jwtExpires });
}

export default authMiddleware;
