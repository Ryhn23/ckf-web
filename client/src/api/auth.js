import client from './client';

/** POST /api/auth/login → { user } */
export const login = (email, password) =>
  client.post('/auth/login', { email, password }).then((r) => r.data);

/** GET /api/auth/me → { user } */
export const getMe = () => client.get('/auth/me').then((r) => r.data);

/** POST /api/auth/logout → { message } */
export const logout = () => client.post('/auth/logout').then((r) => r.data);
