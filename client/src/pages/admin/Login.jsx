import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAuth from '../../hooks/useAuth';
import { errMsg } from '../../api/client';

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(errMsg(err, 'Email atau password salah'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="Logo" className="mx-auto h-24 w-24" />
          <h1 className="mt-4 font-heading text-2xl font-bold text-slate-900">Autentikasi Administrator</h1>
          <p className="mt-1 text-sm text-slate-500">Masuk ke Sistem Informasi Manajemen Yayasan Cinta Kasih Fatimah</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8">
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            placeholder="admin@ckf.or.id"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />

          <label htmlFor="password" className="label mt-4">Kata Sandi</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />

          {error && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} />
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full justify-center">
            {submitting ? 'Memverifikasi Kredensial…' : 'Masuk ke Sistem'}
          </button>
        </form>
      </div>
    </div>
  );
}
