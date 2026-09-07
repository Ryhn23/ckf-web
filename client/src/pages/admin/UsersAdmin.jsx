import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import { getUsers, createUser, updateUser, deleteUser } from '../../api/users';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/formatDate';

const EMPTY_FORM = { name: '', email: '', password: '' };

export default function UsersAdmin() {
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { data, loading, error: fetchError, refetch } = useFetch(() => getUsers(), []);
  const users = data?.data || [];

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
  }

  function startEdit(user) {
    setEditingId(user.id);
    setForm({ name: user.name, email: user.email, password: '' });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim()) {
      setError('Nama dan email wajib diisi.');
      return;
    }
    if (!editingId && !form.password) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const payload = { name: form.name.trim() };
        if (form.password) payload.password = form.password;
        await updateUser(editingId, payload);
      } else {
        await createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      }
      resetForm();
      refetch();
    } catch (err) {
      setError(errMsg(err, 'Gagal menyimpan pengguna'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Hapus pengguna "${user.name}"?`)) return;
    setDeletingId(user.id);
    try {
      await deleteUser(user.id);
      if (editingId === user.id) resetForm();
      refetch();
    } catch {
      /* abaikan */
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <Spinner label="Memuat pengguna…" />;
  if (fetchError) return <EmptyState icon="fa-triangle-exclamation" title="Gagal memuat pengguna" description={errMsg(fetchError)} />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Pengguna & Hak Akses
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Pengelolaan akun administrator dan staf pengelola konten sistem informasi.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-card h-fit p-6 lg:col-span-4 lg:sticky lg:top-20 lg:self-start space-y-4">
          <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            {editingId ? 'Perbarui Data Pengguna' : 'Registrasi Pengguna Baru'}
          </h2>

          <div>
            <label htmlFor="name" className="label text-xs">Nama Lengkap</label>
            <input id="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input text-xs" placeholder="Nama sesuai identitas" />
          </div>

          <div>
            <label htmlFor="email" className="label text-xs">Email Pengguna</label>
            <input
              id="email"
              type="email"
              required
              disabled={!!editingId}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="input text-xs disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              placeholder="email@ckf.or.id"
            />
          </div>

          <div>
            <label htmlFor="password" className="label text-xs">
              Kata Sandi {editingId ? '(kosongkan jika tidak diubah)' : ''}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required={!editingId}
                minLength={6}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="input pr-10 text-xs"
                placeholder="Minimal 6 karakter"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                <FontAwesomeIcon icon={['fa-solid', showPassword ? 'fa-eye-slash' : 'fa-eye']} className="text-xs" />
              </button>
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700">
              <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} />
              {error}
            </p>
          )}

          <div className="pt-2 flex gap-2">
            <button type="submit" disabled={saving} className="admin-btn-primary flex-1 justify-center text-xs font-semibold">
              {saving ? 'Menyimpan…' : editingId ? 'Simpan Perubahan' : 'Tambah Pengguna'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="admin-btn-secondary text-xs">
                Batal
              </button>
            )}
          </div>
        </form>

        {/* Daftar */}
        <div className="lg:col-span-8">
          {users.length === 0 ? (
            <EmptyState icon="fa-users" title="Belum ada pengguna" description="Tambahkan pengguna pertama melalui formulir di samping." />
          ) : (
            <div className="admin-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr>
                      <th className="admin-th">Nama Pengguna</th>
                      <th className="admin-th">Email Akun</th>
                      <th className="admin-th">Terdaftar Sejak</th>
                      <th className="admin-th text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user) => (
                      <tr key={user.id} className="transition hover:bg-slate-50/70">
                        <td className="admin-td font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-800 border border-teal-100 text-xs font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <p className="leading-tight">{user.name}</p>
                              {currentUser?.id === user.id && (
                                <span className="inline-block mt-0.5 rounded-md bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">
                                  Akun Anda
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="admin-td text-slate-600 font-mono text-xs">{user.email}</td>
                        <td className="admin-td whitespace-nowrap text-xs text-slate-500">{formatDate(user.createdAt, 'd MMM yyyy')}</td>
                        <td className="admin-td">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEdit(user)}
                              className="admin-btn-secondary !px-2.5 !py-1 text-xs font-medium"
                              title="Edit Pengguna"
                            >
                              <FontAwesomeIcon icon={['fa-solid', 'fa-pen']} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === user.id || currentUser?.id === user.id}
                              onClick={() => handleDelete(user)}
                              className="admin-btn-danger !px-2.5 !py-1 text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                              title={currentUser?.id === user.id ? 'Akun Anda yang sedang aktif tidak dapat dihapus' : 'Hapus pengguna'}
                            >
                              {deletingId === user.id ? (
                                '…'
                              ) : (
                                <FontAwesomeIcon icon={['fa-solid', 'fa-trash']} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
