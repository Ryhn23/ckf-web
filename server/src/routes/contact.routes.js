import { Router } from 'express';
import { z } from 'zod';
import validate from '../middlewares/validate.js';
import authMiddleware from '../middlewares/auth.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import * as contactController from '../controllers/contact.controller.js';

const router = Router();

const createSchema = validate({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    subject: z.string().max(200).optional(),
    message: z.string().min(5).max(3000),
  }),
});

const listSchema = validate({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    unread: z.enum(['true', 'false']).optional(),
  }),
});

/** POST /api/contact-messages (publik) */
router.post('/', createSchema, contactController.create);

/** Admin */
router.get('/', authMiddleware, requireAdmin, listSchema, contactController.list);
router.patch('/:id/read', authMiddleware, requireAdmin, contactController.markRead);
router.delete('/:id', authMiddleware, requireAdmin, contactController.remove);

export default router;
