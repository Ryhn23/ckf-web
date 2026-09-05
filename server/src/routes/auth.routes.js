import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import validate from '../middlewares/validate.js';
import authMiddleware from '../middlewares/auth.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

// Rate limit login: 5x/menit per IP
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 429, message: 'Terlalu banyak percobaan, coba lagi nanti' } },
});

const loginSchema = validate({
  body: z.object({
    email: z.string().email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
  }),
});

router.post('/login', loginLimiter, loginSchema, authController.login);
router.get('/me', authMiddleware, authController.me);
router.post('/logout', authMiddleware, authController.logout);

export default router;
