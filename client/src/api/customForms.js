import client from './client';

/** GET /api/custom-forms (admin) */
export const getCustomForms = (params) =>
  client.get('/custom-forms', { params }).then((r) => r.data);

/** GET /api/custom-forms/:id (admin) */
export const getCustomFormById = (id) =>
  client.get(`/custom-forms/${id}`).then((r) => r.data);

/** POST /api/custom-forms (admin) */
export const createCustomForm = (payload) =>
  client.post('/custom-forms', payload).then((r) => r.data);

/** PUT /api/custom-forms/:id (admin) */
export const updateCustomForm = (id, payload) =>
  client.put(`/custom-forms/${id}`, payload).then((r) => r.data);

/** PATCH /api/custom-forms/:id/status (admin) */
export const toggleCustomFormStatus = (id) =>
  client.patch(`/custom-forms/${id}/status`).then((r) => r.data);

/** DELETE /api/custom-forms/:id (admin) */
export const deleteCustomForm = (id) =>
  client.delete(`/custom-forms/${id}`).then((r) => r.data);

/** GET /api/custom-forms/p/:slug (publik) */
export const getPublicCustomForm = (slug) =>
  client.get(`/custom-forms/p/${slug}`).then((r) => r.data);

/** POST /api/custom-forms/p/:slug/submit (publik multipart) */
export const submitPublicCustomForm = (slug, formData) =>
  client.post(`/custom-forms/p/${slug}/submit`, formData).then((r) => r.data);

/** GET /api/custom-forms/:id/submissions (admin) */
export const getCustomFormSubmissions = (id, params) =>
  client.get(`/custom-forms/${id}/submissions`, { params }).then((r) => r.data);

/** GET /api/custom-forms/submissions/:submissionId (admin) */
export const getCustomFormSubmissionById = (submissionId) =>
  client.get(`/custom-forms/submissions/${submissionId}`).then((r) => r.data);

/** PATCH /api/custom-forms/submissions/:submissionId (admin) */
export const updateCustomFormSubmission = (submissionId, payload) =>
  client.patch(`/custom-forms/submissions/${submissionId}`, payload).then((r) => r.data);

/** DELETE /api/custom-forms/submissions/:submissionId (admin) */
export const deleteCustomFormSubmission = (submissionId) =>
  client.delete(`/custom-forms/submissions/${submissionId}`).then((r) => r.data);

/** DELETE /api/custom-forms/:id/submissions (admin) → Kosongkan semua respon */
export const clearCustomFormSubmissions = (id) =>
  client.delete(`/custom-forms/${id}/submissions`).then((r) => r.data);

/** GET /api/custom-forms/:id/export (admin) → download .xlsx file */
export const exportCustomFormSubmissions = async (id, customFileName) => {
  const response = await client.get(`/custom-forms/${id}/export`, {
    responseType: 'blob',
  });

  // Extract or fallback filename
  let filename = customFileName || `Respon_Form_${id}.xlsx`;
  const disposition = response.headers['content-disposition'];
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  // Create temporary link and trigger download
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  return { success: true, filename };
};
