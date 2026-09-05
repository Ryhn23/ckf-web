import { Router } from 'express';
import { z } from 'zod';
import validate from '../middlewares/validate.js';
import authMiddleware from '../middlewares/auth.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import * as categoryController from '../controllers/category.controller.js';

const router = Router();

const createSchema = validate({
  body: z.object({
    name: z.string().min(2, 'Nama minimal 2 karakter').max(50),
    description: z.string().max(200).optional(),
    icon: z.string().max(100).optional(),
  }),
});

const updateSchema = validate({
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    description: z.string().max(200).nullable().optional(),
    icon: z.string().max(100).optional(),
    sortOrder: z.number().int().optional(),
  }),
});

router.get('/', categoryController.list);
router.post('/', authMiddleware, requireAdmin, createSchema, categoryController.create);
router.put('/:id', authMiddleware, requireAdmin, updateSchema, categoryController.update);
router.delete('/:id', authMiddleware, requireAdmin, categoryController.remove);

export default router;
