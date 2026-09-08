import { Router } from 'express';
import { z } from 'zod';
import validate from '../middlewares/validate.js';
import authMiddleware from '../middlewares/auth.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import * as aidRequestController from '../controllers/aidRequest.controller.js';

const router = Router();

const createSchema = validate({
  body: z.object({
    type: z.enum(['DANA', 'BARANG']),
    campaignId: z.string().optional().nullable(),
    campaignSlug: z.string().optional().nullable(),
    institutionName: z.string().min(2, 'Nama majelis/lembaga minimal 2 karakter').max(150),
    leaderName: z.string().min(2, 'Nama pimpinan minimal 2 karakter').max(100),
    leaderPhone: z.string().min(8, 'Nomor WhatsApp pimpinan tidak valid').max(30),
    picName: z.string().min(2, 'Nama penanggung jawab minimal 2 karakter').max(100),
    picPhone: z.string().min(8, 'Nomor WhatsApp penanggung jawab tidak valid').max(30),
    amountOrGoods: z.string().min(1, 'Nominal atau rincian bantuan wajib diisi').max(300),
    reason: z.string().min(10, 'Penjelasan alasan minimal 10 karakter').max(5000),
    agreementConsent: z.boolean().refine((val) => val === true, {
      message: 'Persetujuan syarat dan pendataan wajib dicentang',
    }),
  }),
});

const listSchema = validate({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    status: z.enum(['PENDING', 'REVIEWED', 'APPROVED', 'REJECTED']).optional(),
    type: z.enum(['DANA', 'BARANG']).optional(),
    campaignId: z.string().optional(),
    q: z.string().max(100).optional(),
  }),
});

const updateStatusSchema = validate({
  body: z.object({
    status: z.enum(['PENDING', 'REVIEWED', 'APPROVED', 'REJECTED']),
    adminNotes: z.string().max(2000).optional().nullable(),
  }),
});

const campaignCreateSchema = validate({
  body: z.object({
    title: z.string().min(2, 'Nama program atau event minimal 2 karakter').max(150),
    slug: z.string().max(150).optional(),
    description: z.string().max(3000).optional().nullable(),
    image: z.string().max(500).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

const campaignUpdateSchema = validate({
  body: z.object({
    title: z.string().min(2).max(150).optional(),
    slug: z.string().max(150).optional(),
    description: z.string().max(3000).optional().nullable(),
    image: z.string().max(500).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

/** Public routes */
router.get('/campaigns/public/:slug', aidRequestController.getPublicCampaign);
router.post('/', createSchema, aidRequestController.create);

/** Admin Campaign routes */
router.get('/campaigns', authMiddleware, requireAdmin, aidRequestController.listCampaigns);
router.post('/campaigns', authMiddleware, requireAdmin, campaignCreateSchema, aidRequestController.createCampaign);
router.patch('/campaigns/:id', authMiddleware, requireAdmin, campaignUpdateSchema, aidRequestController.updateCampaign);
router.delete('/campaigns/:id', authMiddleware, requireAdmin, aidRequestController.deleteCampaign);

/** Admin Aid Request routes */
router.get('/', authMiddleware, requireAdmin, listSchema, aidRequestController.list);
router.get('/:id', authMiddleware, requireAdmin, aidRequestController.getById);
router.patch('/:id/status', authMiddleware, requireAdmin, updateStatusSchema, aidRequestController.updateStatus);
router.delete('/:id', authMiddleware, requireAdmin, aidRequestController.remove);

export default router;

