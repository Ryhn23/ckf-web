import { Router } from 'express';
import authMiddleware from '../middlewares/auth.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import * as registrationController from '../controllers/registration.controller.js';

const router = Router();

// Protect all registration routes with admin auth
router.use(authMiddleware, requireAdmin);

/**
 * Event Attendance & Export Routes
 * (Placed before generic /events/:id if needed, though with explicit subpaths)
 */
router.get('/events/:id/export-excel', registrationController.exportAttendanceToExcel);
router.get('/events/:id/attendances', registrationController.listAttendances);
router.post('/events/:id/checkin', registrationController.checkInAttendee);
router.delete('/events/:id/attendances/:attendanceId', registrationController.deleteAttendance);

/**
 * Event CRUD Routes
 */
router.get('/events', registrationController.listEvents);
router.post('/events', registrationController.createEvent);
router.get('/events/:id', registrationController.getEventById);
router.put('/events/:id', registrationController.updateEvent);
router.delete('/events/:id', registrationController.deleteEvent);

export default router;
