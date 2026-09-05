import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    // Sesi admin kadaluarsa → arahkan ke login
    if (err.response?.status === 401 && window.location.pathname.startsWith('/admin')) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

/** Ambil pesan error dari response API secara konsisten. */
export function errMsg(err, fallback = 'Terjadi kesalahan, silakan coba lagi') {
  return err?.response?.data?.error?.message || err?.message || fallback;
}

export default client;
