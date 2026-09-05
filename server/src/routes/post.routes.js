import { Router } from 'express';
import { z } from 'zod';
import validate from '../middlewares/validate.js';
import authMiddleware, { optionalAuth } from '../middlewares/auth.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import { upload } from '../middlewares/upload.js';
import * as postController from '../controllers/post.controller.js';

const router = Router();

// Menerima boolean (JSON) atau 'true'/'false' (multipart), normalisasi ke boolean.
const boolField = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((v) => (typeof v === 'boolean' ? v : v === 'true'));

const listSchema = validate({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    category: z.string().optional(),
    tag: z.string().optional(),
    search: z.string().max(100).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
    isFeatured: boolField.optional(),
  }),
});

const createSchema = validate({
  body: z.object({
    title: z.string().min(5, 'Judul minimal 5 karakter').max(200),
    excerpt: z.string().max(300).optional().default(''),
    content: z.string().min(1, 'Konten wajib diisi'),
    categoryId: z.string().min(1),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional().default('PUBLISHED'),
    isFeatured: boolField.optional().default(false),
    tags: z.string().optional(),
  }),
});

const updateSchema = validate({
  body: z.object({
    title: z.string().min(5).max(200).optional(),
    excerpt: z.string().max(300).optional(),
    content: z.string().min(1).optional(),
    categoryId: z.string().min(1).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
    isFeatured: boolField.optional(),
    tags: z.string().optional(),
  }),
});

// Admin — harus sebelum /:slug agar tidak tertangkap route slug
router.get('/by-id/:id', authMiddleware, requireAdmin, postController.getById);

// Publik
router.get('/', optionalAuth, listSchema, postController.list);
router.get('/featured', postController.featured);
router.get('/:slug', postController.getBySlug);

router.post('/', authMiddleware, requireAdmin, upload.single('cover'), createSchema, postController.create);
router.put('/:id', authMiddleware, requireAdmin, upload.single('cover'), updateSchema, postController.update);
router.delete('/:id', authMiddleware, requireAdmin, postController.remove);

export default router;
