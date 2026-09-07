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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center flex flex-col items-center">
          <img src="/logo.png" alt="Logo" className="h-20 w-auto object-contain mb-3" />
          <div className="flex flex-col justify-center leading-none text-slate-900">
            <span className="font-heading text-xs font-extrabold uppercase tracking-wider text-slate-900">
              CINTA KASIH
            </span>
            <span className="font-heading text-lg font-black uppercase tracking-wide mt-0.5 text-black">
              FATIMAH
            </span>
            <span className="font-sans text-[9px] font-bold uppercase tracking-[0.25em] mt-0.5 text-slate-900">
              FOUNDATION
            </span>
          </div>
          <h1 className="mt-6 font-heading text-xl font-bold tracking-tight text-slate-900">
            Portal Administrasi Sistem
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Masuk dengan kredensial terdaftar untuk mengelola sistem informasi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="admin-card p-7 sm:p-8 shadow-xl border border-slate-200/80 space-y-4">
          <div>
            <label htmlFor="email" className="label text-xs font-semibold">Alamat Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="input text-xs"
              placeholder="admin@ckf.or.id"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="password" className="label text-xs font-semibold">Kata Sandi</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className="input text-xs"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-700">
              <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="admin-btn-primary !py-2.5 mt-2 w-full justify-center text-xs font-bold shadow-md"
          >
            {submitting ? 'Memverifikasi Kredensial…' : 'Masuk ke Sistem'}
          </button>
        </form>
      </div>
    </div>
  );
}
