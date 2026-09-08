import client from './client';

/** POST /api/aid-requests (publik) → { message, data: AidRequest } */
export const submitAidRequest = (payload) =>
  client.post('/aid-requests', payload).then((r) => r.data);

/** GET /api/aid-requests/campaigns/public/:slug (publik) → { data: AidCampaign } */
export const getPublicAidCampaign = (slug) =>
  client.get(`/aid-requests/campaigns/public/${slug}`).then((r) => r.data);

/** GET /api/aid-requests/campaigns (admin) → { data: AidCampaign[] } */
export const getAidCampaigns = () =>
  client.get('/aid-requests/campaigns').then((r) => r.data);

/** POST /api/aid-requests/campaigns (admin) → { message, data: AidCampaign } */
export const createAidCampaign = (payload) =>
  client.post('/aid-requests/campaigns', payload).then((r) => r.data);

/** PATCH /api/aid-requests/campaigns/:id (admin) → { message, data: AidCampaign } */
export const updateAidCampaign = (id, payload) =>
  client.patch(`/aid-requests/campaigns/${id}`, payload).then((r) => r.data);

/** DELETE /api/aid-requests/campaigns/:id (admin) → { message } */
export const deleteAidCampaign = (id) =>
  client.delete(`/aid-requests/campaigns/${id}`).then((r) => r.data);

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
