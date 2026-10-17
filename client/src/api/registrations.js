import client from './client';

/** GET /api/registrations/events (admin) */
export const getRegistrationEvents = (params) =>
  client.get('/registrations/events', { params }).then((r) => r.data);

/** GET /api/registrations/events/:id (admin) */
export const getRegistrationEventById = (id) =>
  client.get(`/registrations/events/${id}`).then((r) => r.data);

/** POST /api/registrations/events (admin) */
export const createRegistrationEvent = (payload) =>
  client.post('/registrations/events', payload).then((r) => r.data);

/** PUT /api/registrations/events/:id (admin) */
export const updateRegistrationEvent = (id, payload) =>
  client.put(`/registrations/events/${id}`, payload).then((r) => r.data);

/** DELETE /api/registrations/events/:id (admin) */
export const deleteRegistrationEvent = (id) =>
  client.delete(`/registrations/events/${id}`).then((r) => r.data);

/** GET /api/registrations/events/:id/attendances (admin) */
export const getEventAttendances = (id, params) =>
  client.get(`/registrations/events/${id}/attendances`, { params }).then((r) => r.data);

/** POST /api/registrations/events/:id/checkin (admin) */
export const checkInAttendee = (id, payload) =>
  client.post(`/registrations/events/${id}/checkin`, payload).then((r) => r.data);

/** DELETE /api/registrations/events/:id/attendances/:attendanceId (admin) */
export const deleteEventAttendance = (eventId, attendanceId) =>
  client.delete(`/registrations/events/${eventId}/attendances/${attendanceId}`).then((r) => r.data);

/** GET /api/registrations/events/:id/export-excel (admin) → download .xlsx file */
export const exportEventAttendance = async (id, customFileName) => {
  const response = await client.get(`/registrations/events/${id}/export-excel`, {
    responseType: 'blob',
  });

  let filename = customFileName || `Kehadiran_Acara_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const disposition = response.headers['content-disposition'];
  if (disposition) {
    const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }
  }

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
