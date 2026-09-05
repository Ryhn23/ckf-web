import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { signToken, TOKEN_COOKIE } from '../middlewares/auth.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: 'lax',
  path: '/api',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
};

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw ApiError.unauthorized('Email atau password salah');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Email atau password salah');

  const token = signToken(user);
  res.cookie(TOKEN_COOKIE, token, COOKIE_OPTIONS);

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

/** GET /api/auth/me */
export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

/** POST /api/auth/logout */
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(TOKEN_COOKIE, { ...COOKIE_OPTIONS, maxAge: undefined });
  res.json({ message: 'Berhasil logout' });
});
