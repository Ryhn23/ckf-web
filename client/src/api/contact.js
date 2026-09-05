import client from './client';

/** POST /api/contact-messages (publik) → { data: ContactMessage } */
export const createContactMessage = (payload) =>
  client.post('/contact-messages', payload).then((r) => r.data);

/** GET /api/contact-messages (admin) → { data: ContactMessage[], meta } */
export const getMessages = (params) => client.get('/contact-messages', { params }).then((r) => r.data);

/** PATCH /api/contact-messages/:id/read (admin) → { data: ContactMessage } */
export const markMessageRead = (id) =>
  client.patch(`/contact-messages/${id}/read`).then((r) => r.data);

/** DELETE /api/contact-messages/:id (admin) → { message } */
export const deleteMessage = (id) => client.delete(`/contact-messages/${id}`).then((r) => r.data);
