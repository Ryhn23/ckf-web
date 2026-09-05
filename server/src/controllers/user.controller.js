import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const SELECT = { select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true } };

/** GET /api/users (admin) */
export const list = asyncHandler(async (req, res) => {
  const data = await prisma.user.findMany({ ...SELECT, orderBy: { createdAt: 'asc' } });
  res.json({ data });
});

/** POST /api/users (admin) — body: { name, email, password } */
export const create = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) throw ApiError.badRequest('Nama, email, dan password wajib diisi');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    ...SELECT,
  });

  res.status(201).json({ data: user });
});

/** PUT /api/users/:id (admin) — body: { name?, role?, password? } */
export const update = asyncHandler(async (req, res) => {
  const { name, password } = req.body || {};
  const data = {};

  if (name !== undefined) data.name = name;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  if (!Object.keys(data).length) throw ApiError.badRequest('Tidak ada data yang diubah');

  const user = await prisma.user.update({ where: { id: req.params.id }, data, ...SELECT });
  res.json({ data: user });
});

/** DELETE /api/users/:id (admin) */
export const remove = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) throw ApiError.badRequest('Tidak dapat menghapus akun sendiri');

  const postsCount = await prisma.post.count({ where: { authorId: req.params.id } });
  if (postsCount > 0) {
    throw ApiError.conflict('Pengguna memiliki artikel dan tidak dapat dihapus. Ubah penulis artikelnya terlebih dahulu.');
  }

  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ message: 'Pengguna dihapus' });
});
