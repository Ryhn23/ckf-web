import { Router } from 'express';
import { z } from 'zod';
import validate from '../middlewares/validate.js';
import authMiddleware from '../middlewares/auth.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import * as donationController from '../controllers/donation.controller.js';

const router = Router();

const createSchema = validate({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().optional(),
    phone: z.string().max(30).optional(),
    amount: z.coerce.number().int().positive(),
    programId: z.string().max(50).optional(),
    message: z.string().max(1000).optional(),
  }),
});

const statusSchema = validate({
  body: z.object({ status: z.enum(['PENDING', 'PROCESSED', 'REJECTED']) }),
});

const listSchema = validate({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    status: z.enum(['PENDING', 'PROCESSED', 'REJECTED']).optional(),
  }),
});

/** POST /api/donations (publik) */
router.post('/', createSchema, donationController.create);

/** Admin */
router.get('/', authMiddleware, requireAdmin, listSchema, donationController.list);
router.patch('/:id/status', authMiddleware, requireAdmin, statusSchema, donationController.updateStatus);
router.delete('/:id', authMiddleware, requireAdmin, donationController.remove);

export default router;
