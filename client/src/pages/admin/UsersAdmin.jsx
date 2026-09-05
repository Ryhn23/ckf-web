import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getUsers, createUser, updateUser, deleteUser } from '../../api/users';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/formatDate';

const EMPTY_FORM = { name: '', email: '', password: '' };

export default function UsersAdmin() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
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
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Pengguna</h1>
        <p className="mt-1 text-sm text-slate-500">Kelola akun admin dan editor.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form */}
        <form onSubmit={handleSubmit} className="card h-fit p-6 lg:col-span-4 lg:sticky lg:top-20 lg:self-start">
          <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            {editingId ? 'Edit Pengguna' : 'Pengguna Baru'}
          </h2>

          <label htmlFor="name" className="label mt-4">Nama</label>
          <input id="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" placeholder="Nama lengkap" />

          <label htmlFor="email" className="label mt-4">Email</label>
          <input
            id="email"
            type="email"
            required
            disabled={!!editingId}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="input disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            placeholder="email@ckf.or.id"
          />

          <label htmlFor="password" className="label mt-4">
            Kata Sandi {editingId ? '(kosongkan jika tidak diubah)' : ''}
          </label>
          <input
            id="password"
            type="password"
            required={!editingId}
            minLength={6}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="input"
            placeholder="Minimal 6 karakter"
          />

          {error && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} />
              {error}
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center text-sm">
              {saving ? 'Menyimpan…' : editingId ? 'Simpan Perubahan' : 'Tambah'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn-outline text-sm">
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
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Nama</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Terdaftar</th>
                    <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="transition hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-semibold text-slate-800">{user.name}</td>
                      <td className="px-5 py-3 text-slate-500">{user.email}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-slate-500">{formatDate(user.createdAt, 'd MMM yyyy')}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => startEdit(user)} className="btn-outline !px-3 !py-1.5 text-xs">
                            <FontAwesomeIcon icon={['fa-solid', 'fa-pen']} />
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === user.id}
                            onClick={() => handleDelete(user)}
                            className="btn-danger !px-3 !py-1.5 text-xs"
                          >
                            {deletingId === user.id ? '…' : (
                              <>
                                <FontAwesomeIcon icon={['fa-solid', 'fa-trash']} />
                                Hapus
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
