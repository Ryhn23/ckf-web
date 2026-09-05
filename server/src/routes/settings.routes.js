import { Router } from 'express';
import { z } from 'zod';
import validate from '../middlewares/validate.js';
import authMiddleware from '../middlewares/auth.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import * as settingsController from '../controllers/settings.controller.js';

const router = Router();

const updateSchema = validate({
  body: z.record(z.string()),
});

router.get('/', settingsController.getAll);
router.put('/', authMiddleware, requireAdmin, updateSchema, settingsController.updateAll);

export default router;
