import client from './client';

/** GET /api/testimonials → { data: Testimonial[] } */
export const getTestimonials = () => client.get('/testimonials').then((r) => r.data);

/** POST /api/testimonials (admin) */
export const createTestimonial = (data) => client.post('/testimonials', data).then((r) => r.data);

/** PUT /api/testimonials/:id (admin) */
export const updateTestimonial = (id, data) => client.put(`/testimonials/${id}`, data).then((r) => r.data);

/** DELETE /api/testimonials/:id (admin) */
export const deleteTestimonial = (id) => client.delete(`/testimonials/${id}`).then((r) => r.data);
