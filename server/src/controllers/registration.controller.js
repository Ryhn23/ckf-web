import asyncHandler from '../utils/asyncHandler.js';
import registrationService from '../services/registration.service.js';

/**
 * GET /api/registrations/events (admin)
 */
export const listEvents = asyncHandler(async (req, res) => {
  const result = await registrationService.listEvents(req.query);
  res.json({
    data: result.events,
    meta: result.meta,
    stats: result.stats,
  });
});

/**
 * GET /api/registrations/events/:id (admin)
 */
export const getEventById = asyncHandler(async (req, res) => {
  const event = await registrationService.getEventById(req.params.id);
  res.json({ data: event });
});

/**
 * POST /api/registrations/events (admin)
 */
export const createEvent = asyncHandler(async (req, res) => {
  const event = await registrationService.createEvent(req.body);
  res.status(201).json({
    message: 'Acara registrasi berhasil dibuat',
    data: event,
  });
});

/**
 * PUT /api/registrations/events/:id (admin)
 */
export const updateEvent = asyncHandler(async (req, res) => {
  const event = await registrationService.updateEvent(req.params.id, req.body);
  res.json({
    message: 'Acara registrasi berhasil diperbarui',
    data: event,
  });
});

/**
 * DELETE /api/registrations/events/:id (admin)
 */
export const deleteEvent = asyncHandler(async (req, res) => {
  const result = await registrationService.deleteEvent(req.params.id);
  res.json(result);
});

/**
 * GET /api/registrations/events/:id/attendances (admin)
 */
export const listAttendances = asyncHandler(async (req, res) => {
  const result = await registrationService.listAttendances(req.params.id, req.query);
  res.json({
    event: result.event,
    data: result.attendances,
    meta: result.meta,
    stats: result.stats,
  });
});

/**
 * POST /api/registrations/events/:id/checkin (admin)
 * Check-in via QR scan or manual input
 */
export const checkInAttendee = asyncHandler(async (req, res) => {
  const result = await registrationService.checkInAttendee(req.params.id, req.body);
  res.status(201).json(result);
});

/**
 * DELETE /api/registrations/events/:id/attendances/:attendanceId (admin)
 */
export const deleteAttendance = asyncHandler(async (req, res) => {
  const result = await registrationService.deleteAttendance(req.params.id, req.params.attendanceId);
  res.json(result);
});

/**
 * GET /api/registrations/events/:id/export-excel (admin)
 */
export const exportAttendanceToExcel = asyncHandler(async (req, res) => {
  const { buffer, filename } = await registrationService.exportAttendanceToExcel(req.params.id);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});
