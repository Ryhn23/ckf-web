import asyncHandler from '../utils/asyncHandler.js';
import customFormService from '../services/customForm.service.js';

/**
 * GET /api/custom-forms (admin)
 */
export const listForms = asyncHandler(async (req, res) => {
  const result = await customFormService.listForms(req.query);
  res.json({
    data: result.forms,
    meta: result.meta,
    stats: result.stats,
  });
});

/**
 * GET /api/custom-forms/:id (admin)
 */
export const getFormById = asyncHandler(async (req, res) => {
  const form = await customFormService.getFormById(req.params.id);
  res.json({ data: form });
});

/**
 * POST /api/custom-forms (admin)
 */
export const createForm = asyncHandler(async (req, res) => {
  const form = await customFormService.createForm(req.body);
  res.status(201).json({
    message: 'Formulir kustom berhasil dibuat',
    data: form,
  });
});

/**
 * PUT /api/custom-forms/:id (admin)
 */
export const updateForm = asyncHandler(async (req, res) => {
  const form = await customFormService.updateForm(req.params.id, req.body);
  res.json({
    message: 'Formulir kustom berhasil diperbarui',
    data: form,
  });
});

/**
 * PATCH /api/custom-forms/:id/status (admin)
 */
export const toggleFormStatus = asyncHandler(async (req, res) => {
  const form = await customFormService.toggleFormStatus(req.params.id);
  res.json({
    message: `Formulir ${form.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
    data: form,
  });
});

/**
 * DELETE /api/custom-forms/:id (admin)
 */
export const deleteForm = asyncHandler(async (req, res) => {
  const result = await customFormService.deleteForm(req.params.id);
  res.json(result);
});

/**
 * GET /api/custom-forms/p/:slug (publik)
 */
export const getPublicForm = asyncHandler(async (req, res) => {
  const form = await customFormService.getPublicFormBySlug(req.params.slug);
  res.json({ data: form });
});

/**
 * POST /api/custom-forms/p/:slug/submit (publik multipart)
 */
export const submitPublicForm = asyncHandler(async (req, res) => {
  const rawData = req.body || {};
  const files = req.files || [];

  const result = await customFormService.submitPublicForm(req.params.slug, rawData, files);
  res.status(201).json(result);
});

/**
 * GET /api/custom-forms/:id/submissions (admin)
 */
export const listSubmissions = asyncHandler(async (req, res) => {
  const result = await customFormService.listSubmissions(req.params.id, req.query);
  res.json({
    form: result.form,
    data: result.submissions,
    meta: result.meta,
    statusCounts: result.statusCounts,
  });
});

/**
 * GET /api/custom-forms/submissions/:submissionId (admin)
 */
export const getSubmissionById = asyncHandler(async (req, res) => {
  const submission = await customFormService.getSubmissionById(req.params.submissionId);
  res.json({ data: submission });
});

/**
 * PATCH /api/custom-forms/submissions/:submissionId (admin)
 */
export const updateSubmission = asyncHandler(async (req, res) => {
  const submission = await customFormService.updateSubmission(req.params.submissionId, req.body);
  res.json({
    message: 'Respon formulir berhasil diperbarui',
    data: submission,
  });
});

/**
 * DELETE /api/custom-forms/submissions/:submissionId (admin)
 */
export const deleteSubmission = asyncHandler(async (req, res) => {
  const result = await customFormService.deleteSubmission(req.params.submissionId);
  res.json(result);
});

/**
 * DELETE /api/custom-forms/:id/submissions (admin)
 * Clear all submissions of a form without deleting the form
 */
export const clearAllSubmissions = asyncHandler(async (req, res) => {
  const result = await customFormService.clearAllSubmissions(req.params.id);
  res.json(result);
});

/**
 * GET /api/custom-forms/:id/export (admin)
 * Streams formatted .xlsx Excel file
 */
export const exportSubmissions = asyncHandler(async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const { buffer, filename } = await customFormService.exportSubmissionsToExcel(req.params.id, baseUrl);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  res.send(Buffer.from(buffer));
});
