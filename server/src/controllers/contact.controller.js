import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/** POST /api/contact-messages (publik) */
export const create = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !message) throw ApiError.badRequest('Nama, email, dan pesan wajib diisi');

  const contact = await prisma.contactMessage.create({
    data: {
      name,
      email,
      subject: subject || null,
      message,
    },
  });

  res.status(201).json({ data: contact });
});

/** GET /api/contact-messages (admin) */
export const list = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
  const where = req.query.unread === 'true' ? { isRead: false } : {};

  const [total, data] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

/** PATCH /api/contact-messages/:id/read (admin) */
export const markRead = asyncHandler(async (req, res) => {
  const contact = await prisma.contactMessage.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });

  res.json({ data: contact });
});

/** DELETE /api/contact-messages/:id (admin) */
export const remove = asyncHandler(async (req, res) => {
  await prisma.contactMessage.delete({ where: { id: req.params.id } });
  res.json({ message: 'Pesan dihapus' });
});
