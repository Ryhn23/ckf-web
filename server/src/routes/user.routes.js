import { Router } from 'express';
import { z } from 'zod';
import validate from '../middlewares/validate.js';
import authMiddleware from '../middlewares/auth.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import * as userController from '../controllers/user.controller.js';

const router = Router();

const createSchema = validate({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(6).max(100),
  }),
});

const updateSchema = validate({
  body: z
    .object({
      name: z.string().min(2).max(100).optional(),
      password: z.string().min(6).max(100).optional(),
    })
    .refine((v) => v.name !== undefined || v.password !== undefined, {
      message: 'Minimal satu field (name atau password) harus diisi',
    }),
});

router.use(authMiddleware, requireAdmin);

router.get('/', userController.list);
router.post('/', createSchema, userController.create);
router.put('/:id', updateSchema, userController.update);
router.delete('/:id', userController.remove);

export default router;
