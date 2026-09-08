import { randomUUID } from 'node:crypto';
import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { slugify } from '../utils/slugify.js';

/** Buat nomor tiket unik permohonan bantuan, misal: PB-20260907-8F2A */
function makeTicketNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase();
  return `PB-${dateStr}-${rand}`;
}

/** GET /api/aid-requests/campaigns/public/:slug (publik) */
export const getPublicCampaign = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const campaign = await prisma.aidCampaign.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      image: true,
      isActive: true,
    },
  });

  if (!campaign) {
    throw ApiError.notFound('Halaman formulir permohonan bantuan khusus tidak ditemukan');
  }

  res.json({ data: campaign });
});

/** GET /api/aid-requests/campaigns (admin) */
export const listCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await prisma.aidCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { requests: true },
      },
    },
  });

  res.json({ data: campaigns });
});

/** POST /api/aid-requests/campaigns (admin) */
export const createCampaign = asyncHandler(async (req, res) => {
  const { title, slug: customSlug, description, image, isActive } = req.body || {};
  if (!title || !title.trim()) {
    throw ApiError.badRequest('Nama program atau event wajib diisi');
  }

  let finalSlug = slugify(customSlug && customSlug.trim() ? customSlug.trim() : title);
  if (!finalSlug) {
    finalSlug = `event-${Date.now()}`;
  }

  // Cek jika slug sudah ada
  const existing = await prisma.aidCampaign.findUnique({
    where: { slug: finalSlug },
  });
  if (existing) {
    finalSlug = `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`;
  }

  const campaign = await prisma.aidCampaign.create({
    data: {
      title: title.trim(),
      slug: finalSlug,
      description: description ? description.trim() : null,
      image: image ? image.trim() : null,
      isActive: typeof isActive === 'boolean' ? isActive : true,
    },
  });

  res.status(201).json({
    message: 'Formulir event khusus berhasil dibuat',
    data: campaign,
  });
});

/** PATCH /api/aid-requests/campaigns/:id (admin) */
export const updateCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, slug: customSlug, description, image, isActive } = req.body || {};

  const existing = await prisma.aidCampaign.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Event formulir tidak ditemukan');
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title.trim();
  if (description !== undefined) updateData.description = description ? description.trim() : null;
  if (image !== undefined) updateData.image = image ? image.trim() : null;
  if (typeof isActive === 'boolean') updateData.isActive = isActive;

  if (customSlug && customSlug.trim() && customSlug.trim() !== existing.slug) {
    const finalSlug = slugify(customSlug);
    const slugConflict = await prisma.aidCampaign.findUnique({ where: { slug: finalSlug } });
    if (slugConflict && slugConflict.id !== id) {
      throw ApiError.badRequest('Tautan URL slug ini sudah digunakan oleh event lain');
    }
    updateData.slug = finalSlug;
  }

  const updated = await prisma.aidCampaign.update({
    where: { id },
    data: updateData,
  });

  res.json({
    message: 'Formulir event khusus berhasil diperbarui',
    data: updated,
  });
});

/** DELETE /api/aid-requests/campaigns/:id (admin) */
export const deleteCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.aidCampaign.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Event formulir tidak ditemukan');
  }

  // Set permohonan yang ada menjadi tanpa campaign
  await prisma.aidRequest.updateMany({
    where: { campaignId: id },
    data: { campaignId: null },
  });

  await prisma.aidCampaign.delete({ where: { id } });

  res.json({ message: 'Formulir event khusus berhasil dihapus' });
});

/** POST /api/aid-requests (publik) */
export const create = asyncHandler(async (req, res) => {
  const {
    type,
    campaignId,
    campaignSlug,
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

  let resolvedCampaignId = null;
  if (campaignSlug && campaignSlug.trim()) {
    const c = await prisma.aidCampaign.findUnique({ where: { slug: campaignSlug.trim() } });
    if (c) {
      if (!c.isActive) {
        throw ApiError.badRequest('Penerimaan permohonan bantuan untuk event ini telah ditutup');
      }
      resolvedCampaignId = c.id;
    }
  } else if (campaignId && campaignId.trim()) {
    const c = await prisma.aidCampaign.findUnique({ where: { id: campaignId.trim() } });
    if (c) {
      if (!c.isActive) {
        throw ApiError.badRequest('Penerimaan permohonan bantuan untuk event ini telah ditutup');
      }
      resolvedCampaignId = c.id;
    }
  }

  const aidRequest = await prisma.aidRequest.create({
    data: {
      ticketNumber: makeTicketNumber(),
      type: type === 'BARANG' ? 'BARANG' : 'DANA',
      campaignId: resolvedCampaignId,
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
    include: {
      campaign: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
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
  const { status, type, q, campaignId } = req.query;

  const where = {};
  if (status && ['PENDING', 'REVIEWED', 'APPROVED', 'REJECTED'].includes(status)) {
    where.status = status;
  }
  if (type && ['DANA', 'BARANG'].includes(type)) {
    where.type = type;
  }
  if (campaignId === 'none') {
    where.campaignId = null;
  } else if (campaignId && campaignId.trim()) {
    where.campaignId = campaignId.trim();
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
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
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
    include: {
      campaign: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
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
    include: {
      campaign: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
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
