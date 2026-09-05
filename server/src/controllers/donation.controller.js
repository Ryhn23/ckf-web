import { randomUUID } from 'node:crypto';
import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/** Buat nomor referensi unik, contoh: CKF-8F3K2A-9Q1Z */
function makeReference() {
  const rand = randomUUID().replace(/-/g, '').toUpperCase();
  return `CKF-${rand.slice(0, 6)}-${rand.slice(6, 10)}`;
}

/** POST /api/donations (publik) */
export const create = asyncHandler(async (req, res) => {
  const { name, email, phone, amount, programId, message } = req.body || {};
  if (!name || !amount) throw ApiError.badRequest('Nama dan nominal donasi wajib diisi');

  const donation = await prisma.donation.create({
    data: {
      reference: makeReference(),
      name,
      email: email || null,
      phone: phone || null,
      amount: Number(amount),
      programId: programId || null,
      message: message || null,
    },
  });

  res.status(201).json({ data: donation });
});

/** GET /api/donations (admin) */
export const list = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
  const where = req.query.status ? { status: req.query.status } : {};

  const [total, data] = await Promise.all([
    prisma.donation.count({ where }),
    prisma.donation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

/** PATCH /api/donations/:id/status (admin) */
export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!['PENDING', 'PROCESSED', 'REJECTED'].includes(status)) {
    throw ApiError.badRequest('Status tidak valid');
  }

  const donation = await prisma.donation.update({
    where: { id: req.params.id },
    data: { status },
  });

  res.json({ data: donation });
});

/** DELETE /api/donations/:id (admin) */
export const remove = asyncHandler(async (req, res) => {
  await prisma.donation.delete({ where: { id: req.params.id } });
  res.json({ message: 'Donasi dihapus' });
});
