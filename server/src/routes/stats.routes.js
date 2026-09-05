import { Router } from 'express';
import authMiddleware from '../middlewares/auth.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import * as statsController from '../controllers/stats.controller.js';

const router = Router();

router.get('/dashboard', authMiddleware, requireAdmin, statsController.dashboard);

export default router;
