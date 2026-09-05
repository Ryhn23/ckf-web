import client from './client';

/** POST /api/donations (publik) → { data: Donation } */
export const createDonation = (payload) =>
  client.post('/donations', payload).then((r) => r.data);

/** GET /api/donations (admin) → { data: Donation[], meta } */
export const getDonations = (params) => client.get('/donations', { params }).then((r) => r.data);

/** PATCH /api/donations/:id/status (admin) → { data: Donation } */
export const updateDonationStatus = (id, status) =>
  client.patch(`/donations/${id}/status`, { status }).then((r) => r.data);

/** DELETE /api/donations/:id (admin) → { message } */
export const deleteDonation = (id) => client.delete(`/donations/${id}`).then((r) => r.data);
