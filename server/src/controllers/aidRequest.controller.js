import { randomUUID } from 'node:crypto';
import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/** Buat nomor tiket unik permohonan bantuan, misal: PB-20260907-8F2A */
function makeTicketNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase();
  return `PB-${dateStr}-${rand}`;
}

/** POST /api/aid-requests (publik) */
export const create = asyncHandler(async (req, res) => {
  const {
    type,
    institutionName,
    leaderName,
    leaderPhone,
    picName,
    picPhone,
    amountOrGoods,
    reason,
    agreementConsent,
  } = req.body || {};

  if (!agreementConsent) {
    throw ApiError.badRequest('Persetujuan permohonan bantuan wajib disetujui');
  }

  const aidRequest = await prisma.aidRequest.create({
    data: {
      ticketNumber: makeTicketNumber(),
      type: type === 'BARANG' ? 'BARANG' : 'DANA',
      institutionName: institutionName.trim(),
      leaderName: leaderName.trim(),
      leaderPhone: leaderPhone.trim(),
      picName: picName.trim(),
      picPhone: picPhone.trim(),
      amountOrGoods: amountOrGoods.trim(),
      reason: reason.trim(),
      agreementConsent: Boolean(agreementConsent),
      status: 'PENDING',
    },
  });

  res.status(201).json({
    message: 'Permohonan bantuan berhasil diajukan',
    data: aidRequest,
  });
});

/** GET /api/aid-requests (admin) */
export const list = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 15, 1), 50);
  const { status, type, q } = req.query;

  const where = {};
  if (status && ['PENDING', 'REVIEWED', 'APPROVED', 'REJECTED'].includes(status)) {
    where.status = status;
  }
  if (type && ['DANA', 'BARANG'].includes(type)) {
    where.type = type;
  }
  if (q && q.trim()) {
    const search = q.trim();
    where.OR = [
      { ticketNumber: { contains: search, mode: 'insensitive' } },
      { institutionName: { contains: search, mode: 'insensitive' } },
      { leaderName: { contains: search, mode: 'insensitive' } },
      { picName: { contains: search, mode: 'insensitive' } },
      { leaderPhone: { contains: search, mode: 'insensitive' } },
      { picPhone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, data, summary] = await Promise.all([
    prisma.aidRequest.count({ where }),
    prisma.aidRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    Promise.all([
      prisma.aidRequest.count(),
      prisma.aidRequest.count({ where: { status: 'PENDING' } }),
      prisma.aidRequest.count({ where: { status: 'REVIEWED' } }),
      prisma.aidRequest.count({ where: { status: 'APPROVED' } }),
      prisma.aidRequest.count({ where: { status: 'REJECTED' } }),
      prisma.aidRequest.count({ where: { type: 'DANA' } }),
      prisma.aidRequest.count({ where: { type: 'BARANG' } }),
    ]).then(([totalAll, pendingCount, reviewedCount, approvedCount, rejectedCount, danaCount, barangCount]) => ({
      totalAll,
      pendingCount,
      reviewedCount,
      approvedCount,
      rejectedCount,
      danaCount,
      barangCount,
    })),
  ]);

  res.json({
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    summary,
  });
});

/** GET /api/aid-requests/:id (admin) */
export const getById = asyncHandler(async (req, res) => {
  const aidRequest = await prisma.aidRequest.findUnique({
    where: { id: req.params.id },
  });

  if (!aidRequest) {
    throw ApiError.notFound('Permohonan bantuan tidak ditemukan');
  }

  res.json({ data: aidRequest });
});

/** PATCH /api/aid-requests/:id/status (admin) */
export const updateStatus = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body || {};

  if (!status || !['PENDING', 'REVIEWED', 'APPROVED', 'REJECTED'].includes(status)) {
    throw ApiError.badRequest('Status tidak valid');
  }

  const existing = await prisma.aidRequest.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    throw ApiError.notFound('Permohonan bantuan tidak ditemukan');
  }

  const updateData = { status };
  if (adminNotes !== undefined) {
    updateData.adminNotes = adminNotes;
  }

  const updated = await prisma.aidRequest.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.json({
    message: 'Status permohonan berhasil diperbarui',
    data: updated,
  });
});

/** DELETE /api/aid-requests/:id (admin) */
export const remove = asyncHandler(async (req, res) => {
  const existing = await prisma.aidRequest.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    throw ApiError.notFound('Permohonan bantuan tidak ditemukan');
  }

  await prisma.aidRequest.delete({
    where: { id: req.params.id },
  });

  res.json({ message: 'Permohonan bantuan berhasil dihapus' });
});
