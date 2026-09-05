import client from './client';

/** GET /api/stats/dashboard → { data } */
export const getDashboardStats = () => client.get('/stats/dashboard').then((r) => r.data);
