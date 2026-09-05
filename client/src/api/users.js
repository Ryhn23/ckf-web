import client from './client';

/** GET /api/users (admin) → { data: User[] } */
export const getUsers = () => client.get('/users').then((r) => r.data);

/** POST /api/users (admin) → { data: User } */
export const createUser = (payload) => client.post('/users', payload).then((r) => r.data);

/** PUT /api/users/:id (admin) → { data: User } */
export const updateUser = (id, payload) => client.put(`/users/${id}`, payload).then((r) => r.data);

/** DELETE /api/users/:id (admin) → { message } */
export const deleteUser = (id) => client.delete(`/users/${id}`).then((r) => r.data);
