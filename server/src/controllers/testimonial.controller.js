import prisma from '../config/prisma.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

/** GET /api/testimonials (publik) — daftar testimoni terurut */
export const list = asyncHandler(async (req, res) => {
  const data = await prisma.testimonial.findMany({
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ data });
});

/** POST /api/testimonials (admin) — tambah testimoni baru */
export const create = asyncHandler(async (req, res) => {
  const { name, role, quote, avatar, sortOrder } = req.body;
  const testimonial = await prisma.testimonial.create({
    data: {
      name,
      role,
      quote,
      avatar: avatar || null,
      sortOrder: Number(sortOrder) || 0,
    },
  });
  res.status(201).json({ data: testimonial });
});

/** PUT /api/testimonials/:id (admin) — perbarui data testimoni */
export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Testimoni tidak ditemukan');
  }

  const { name, role, quote, avatar, sortOrder } = req.body;
  const updated = await prisma.testimonial.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(quote !== undefined && { quote }),
      ...(avatar !== undefined && { avatar: avatar || null }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
    },
  });
  res.json({ data: updated });
});

/** DELETE /api/testimonials/:id (admin) — hapus testimoni */
export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Testimoni tidak ditemukan');
  }

  await prisma.testimonial.delete({ where: { id } });
  res.json({ data: { message: 'Testimoni berhasil dihapus' } });
});
