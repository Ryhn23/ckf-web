import { Router } from 'express';
import authMiddleware from '../middlewares/auth.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import { uploadMedia } from '../middlewares/upload.js';
import * as customFormController from '../controllers/customForm.controller.js';

const router = Router();

/**
 * Public Routes
 */
router.get('/p/:slug', customFormController.getPublicForm);
router.post('/p/:slug/submit', uploadMedia.any(), customFormController.submitPublicForm);

/**
 * Admin Routes - Form Management
 */
router.get('/', authMiddleware, requireAdmin, customFormController.listForms);
router.post('/', authMiddleware, requireAdmin, customFormController.createForm);
router.get('/:id', authMiddleware, requireAdmin, customFormController.getFormById);
router.put('/:id', authMiddleware, requireAdmin, customFormController.updateForm);
router.patch('/:id/status', authMiddleware, requireAdmin, customFormController.toggleFormStatus);
router.delete('/:id', authMiddleware, requireAdmin, customFormController.deleteForm);

/**
 * Admin Routes - Submissions & Excel Export
 */
router.get('/:id/submissions', authMiddleware, requireAdmin, customFormController.listSubmissions);
router.get('/submissions/:submissionId', authMiddleware, requireAdmin, customFormController.getSubmissionById);
router.patch('/submissions/:submissionId', authMiddleware, requireAdmin, customFormController.updateSubmission);
router.delete('/submissions/:submissionId', authMiddleware, requireAdmin, customFormController.deleteSubmission);
router.get('/:id/export', authMiddleware, requireAdmin, customFormController.exportSubmissions);

export default router;
