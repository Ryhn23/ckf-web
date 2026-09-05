import client from './client';

/** GET /api/settings → { data: Record<string,string> } */
export const getSettings = () => client.get('/settings').then((r) => r.data);

/** PUT /api/settings → { data } */
export const saveSettings = (payload) => client.put('/settings', payload).then((r) => r.data);
