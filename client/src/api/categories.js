import client from './client';

/** GET /api/categories → { data: Category[] } */
export const getCategories = () => client.get('/categories').then((r) => r.data);

/** POST /api/categories → { data: Category } */
export const createCategory = (payload) => client.post('/categories', payload).then((r) => r.data);

/** PUT /api/categories/:id → { data: Category } */
export const updateCategory = (id, payload) => client.put(`/categories/${id}`, payload).then((r) => r.data);

/** DELETE /api/categories/:id → { message } */
export const deleteCategory = (id) => client.delete(`/categories/${id}`).then((r) => r.data);
