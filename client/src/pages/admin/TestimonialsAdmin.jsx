import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '../../api/testimonials';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const EMPTY_FORM = {
  name: '',
  role: '',
  quote: '',
  avatar: '',
  sortOrder: 0,
};

export default function TestimonialsAdmin() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { data, loading, error: fetchError, refetch } = useFetch(() => getTestimonials(), []);
  const testimonials = data?.data || [];

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name || '',
      role: item.role || '',
      quote: item.quote || '',
      avatar: item.avatar || '',
      sortOrder: item.sortOrder || 0,
    });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.role.trim() || !form.quote.trim()) {
      setError('Nama, peran, dan kutipan testimoni wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        role: form.role.trim(),
        quote: form.quote.trim(),
        avatar: form.avatar.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (editingId) {
        await updateTestimonial(editingId, payload);
      } else {
        await createTestimonial(payload);
      }
      resetForm();
      refetch();
    } catch (err) {
      setError(errMsg(err, 'Gagal menyimpan testimoni'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus testimoni dari "${item.name}"?`)) return;
    setDeletingId(item.id);
    try {
      await deleteTestimonial(item.id);
      if (editingId === item.id) resetForm();
      refetch();
    } catch (err) {
      setError(errMsg(err, 'Gagal menghapus testimoni'));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <Spinner label="Memuat testimoni…" />;
  if (fetchError) {
    return (
      <EmptyState
        icon="fa-triangle-exclamation"
        title="Gagal memuat testimoni"
        description={errMsg(fetchError)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
            Testimoni
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola testimoni penerima bantuan dan mitra.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Formulir Sticky */}
        <form
          onSubmit={handleSubmit}
          className="admin-card h-fit p-6 lg:col-span-4 lg:sticky lg:top-20 lg:self-start space-y-4"
        >
          <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            {editingId ? 'Edit Testimoni' : 'Tambah Testimoni'}
          </h2>

          <div>
            <label htmlFor="t_name" className="label text-xs">
              Nama Lengkap
            </label>
            <input
              id="t_name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input text-xs"
              placeholder="Contoh: Rina Marlina"
            />
          </div>

          <div>
            <label htmlFor="t_role" className="label text-xs">
              Peran / Status
            </label>
            <input
              id="t_role"
              required
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="input text-xs"
              placeholder="Contoh: Penerima Beasiswa"
            />
          </div>

          <div>
            <label htmlFor="t_quote" className="label text-xs">
              Isi Testimoni
            </label>
            <textarea
              id="t_quote"
              required
              rows={4}
              value={form.quote}
              onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
              className="input text-xs"
              placeholder="Tulis testimoni atau kesan pesan..."
            />
          </div>

          <div>
            <label htmlFor="t_avatar" className="label text-xs">
              Foto / Avatar (Opsional)
            </label>
            <input
              id="t_avatar"
              value={form.avatar}
              onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
              className="input text-xs"
              placeholder="https://... atau /uploads/..."
            />
          </div>

          <div>
            <label htmlFor="t_order" className="label text-xs">
              Urutan
            </label>
            <input
              id="t_order"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              className="input text-xs"
            />
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700">
              <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} />
              {error}
            </p>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="admin-btn-primary flex-1 justify-center text-xs font-semibold"
            >
              {saving ? 'Menyimpan…' : editingId ? 'Simpan Perubahan' : 'Tambah Testimoni'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="admin-btn-secondary text-xs">
                Batal
              </button>
            )}
          </div>
        </form>

        {/* Tabel Data Testimoni */}
        <div className="lg:col-span-8">
          {testimonials.length === 0 ? (
            <EmptyState
              icon="fa-quote-left"
              title="Belum ada testimoni"
              description="Tambahkan testimoni pertama melalui formulir di samping."
            />
          ) : (
            <div className="admin-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[580px] text-left text-sm">
                  <thead>
                    <tr>
                      <th className="admin-th">Pemberi Testimoni</th>
                      <th className="admin-th">Kutipan</th>
                      <th className="admin-th">Urutan</th>
                      <th className="admin-th text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {testimonials.map((item) => (
                      <tr key={item.id} className="transition hover:bg-slate-50/70">
                        <td className="admin-td">
                          <div className="flex items-center gap-3">
                            {item.avatar ? (
                              <img
                                src={item.avatar}
                                alt={item.name}
                                className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100"
                              />
                            ) : (
                              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white shadow-xs">
                                {item.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                            <div>
                              <p className="font-bold text-slate-900">{item.name}</p>
                              <p className="text-xs text-slate-500">{item.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="admin-td">
                          <p className="line-clamp-2 max-w-sm text-xs leading-relaxed text-slate-600 italic">
                            “{item.quote}”
                          </p>
                        </td>
                        <td className="admin-td text-slate-500 font-medium">{item.sortOrder}</td>
                        <td className="admin-td">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="admin-btn-secondary !px-2.5 !py-1 text-xs font-medium"
                              title="Edit Testimoni"
                            >
                              <FontAwesomeIcon icon={['fa-solid', 'fa-pen']} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === item.id}
                              onClick={() => handleDelete(item)}
                              className="admin-btn-danger !px-2.5 !py-1 text-xs font-medium"
                              title="Hapus Testimoni"
                            >
                              {deletingId === item.id ? (
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
