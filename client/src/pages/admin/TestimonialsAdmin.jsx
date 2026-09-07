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
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Manajemen Testimoni</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola testimoni penerima manfaat, donatur, dan mitra yang ditampilkan pada halaman beranda.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Formulir Sticky */}
        <form
          onSubmit={handleSubmit}
          className="card h-fit p-6 lg:col-span-4 lg:sticky lg:top-20 lg:self-start"
        >
          <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            {editingId ? 'Perbarui Testimoni' : 'Tambah Testimoni Baru'}
          </h2>

          <label htmlFor="t_name" className="label mt-4">
            Nama Lengkap
          </label>
          <input
            id="t_name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="input"
            placeholder="Contoh: Rina Marlina"
          />

          <label htmlFor="t_role" className="label mt-4">
            Peran / Status Lembaga
          </label>
          <input
            id="t_role"
            required
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="input"
            placeholder="Contoh: Penerima Beasiswa Pendidikan"
          />

          <label htmlFor="t_quote" className="label mt-4">
            Kutipan Pernyataan / Testimoni
          </label>
          <textarea
            id="t_quote"
            required
            rows={4}
            value={form.quote}
            onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
            className="input"
            placeholder="Tuliskan pengalaman atau pesan kesan..."
          />

          <label htmlFor="t_avatar" className="label mt-4">
            URL Foto / Avatar (Opsional)
          </label>
          <input
            id="t_avatar"
            value={form.avatar}
            onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
            className="input"
            placeholder="https://... atau /uploads/..."
          />

          <label htmlFor="t_order" className="label mt-4">
            Urutan Tampil
          </label>
          <input
            id="t_order"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            className="input"
          />

          {error && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} />
              {error}
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 justify-center text-sm"
            >
              {saving ? 'Menyimpan…' : editingId ? 'Simpan Perubahan' : 'Tambah Testimoni'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn-outline text-sm">
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
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[580px] text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Pemberi Testimoni</th>
                    <th className="px-5 py-3 font-semibold">Kutipan</th>
                    <th className="px-5 py-3 font-semibold">Urutan</th>
                    <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {testimonials.map((item) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {item.avatar ? (
                            <img
                              src={item.avatar}
                              alt={item.name}
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100"
                            />
                          ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white shadow-sm">
                              {item.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="line-clamp-2 max-w-sm text-xs leading-relaxed text-slate-600">
                          “{item.quote}”
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{item.sortOrder}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="btn-outline !px-3 !py-1.5 text-xs"
                          >
                            <FontAwesomeIcon icon={['fa-solid', 'fa-pen']} />
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item)}
                            className="btn-danger !px-3 !py-1.5 text-xs"
                          >
                            {deletingId === item.id ? (
                              '…'
                            ) : (
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
