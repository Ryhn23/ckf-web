import { Router } from 'express';
import { z } from 'zod';
import validate from '../middlewares/validate.js';
import authMiddleware from '../middlewares/auth.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import { uploadMedia } from '../middlewares/upload.js';
import * as mediaController from '../controllers/media.controller.js';

const router = Router();

const listSchema = validate({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

router.post('/upload', authMiddleware, requireAdmin, uploadMedia.single('file'), mediaController.upload);
router.get('/public', listSchema, mediaController.listPublic);
router.get('/', authMiddleware, requireAdmin, listSchema, mediaController.list);
router.delete('/:id', authMiddleware, requireAdmin, mediaController.remove);

export default router;
