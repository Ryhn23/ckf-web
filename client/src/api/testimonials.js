import client from './client';

/** GET /api/testimonials → { data: Testimonial[] } */
export const getTestimonials = () => client.get('/testimonials').then((r) => r.data);
