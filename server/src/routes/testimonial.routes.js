import { Router } from 'express';
import { z } from 'zod';
import validate from '../middlewares/validate.js';
import authMiddleware from '../middlewares/auth.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import * as testimonialController from '../controllers/testimonial.controller.js';

const router = Router();

const createSchema = validate({
  body: z.object({
    name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
    role: z.string().min(2, 'Peran/status minimal 2 karakter').max(100),
    quote: z.string().min(5, 'Kutipan minimal 5 karakter').max(500),
    avatar: z.string().max(500).nullable().optional(),
    sortOrder: z.number().int().optional(),
  }),
});

const updateSchema = validate({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    role: z.string().min(2).max(100).optional(),
    quote: z.string().min(5).max(500).optional(),
    avatar: z.string().max(500).nullable().optional(),
    sortOrder: z.number().int().optional(),
  }),
});

/** GET /api/testimonials (publik) */
router.get('/', testimonialController.list);

/** POST /api/testimonials (admin) */
router.post('/', authMiddleware, requireAdmin, createSchema, testimonialController.create);

/** PUT /api/testimonials/:id (admin) */
router.put('/:id', authMiddleware, requireAdmin, updateSchema, testimonialController.update);

/** DELETE /api/testimonials/:id (admin) */
router.delete('/:id', authMiddleware, requireAdmin, testimonialController.remove);

export default router;
