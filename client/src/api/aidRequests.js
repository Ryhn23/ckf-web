import client from './client';

/** POST /api/aid-requests (publik) → { message, data: AidRequest } */
export const submitAidRequest = (payload) =>
  client.post('/aid-requests', payload).then((r) => r.data);

/** GET /api/aid-requests (admin) → { data: AidRequest[], meta, summary } */
export const getAidRequests = (params) =>
  client.get('/aid-requests', { params }).then((r) => r.data);

/** GET /api/aid-requests/:id (admin) → { data: AidRequest } */
export const getAidRequestById = (id) =>
  client.get(`/aid-requests/${id}`).then((r) => r.data);

/** PATCH /api/aid-requests/:id/status (admin) → { message, data: AidRequest } */
export const updateAidRequestStatus = (id, payload) =>
  client.patch(`/aid-requests/${id}/status`, payload).then((r) => r.data);

/** DELETE /api/aid-requests/:id (admin) → { message } */
export const deleteAidRequest = (id) =>
  client.delete(`/aid-requests/${id}`).then((r) => r.data);
