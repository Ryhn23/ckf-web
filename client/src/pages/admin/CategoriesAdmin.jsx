import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/categories';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const EMPTY_FORM = { name: '', description: '', icon: 'fa-solid fa-circle', sortOrder: 0 };

export default function CategoriesAdmin() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { data, loading, error: fetchError, refetch } = useFetch(() => getCategories(), []);
  const categories = data?.data || [];

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
  }

  function startEdit(cat) {
    setEditingId(cat.id);
    setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || 'fa-solid fa-circle', sortOrder: cat.sortOrder || 0 });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Nama kategori wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || null,
        icon: form.icon.trim() || 'fa-solid fa-circle',
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editingId) await updateCategory(editingId, payload);
      else await createCategory(payload);
      resetForm();
      refetch();
    } catch (err) {
      setError(errMsg(err, 'Gagal menyimpan kategori'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat) {
    if (!window.confirm(`Hapus kategori "${cat.name}"?`)) return;
    setDeletingId(cat.id);
    try {
      await deleteCategory(cat.id);
      if (editingId === cat.id) resetForm();
      refetch();
    } catch {
      /* abaikan */
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <Spinner label="Memuat kategori…" />;
  if (fetchError) return <EmptyState icon="fa-triangle-exclamation" title="Gagal memuat kategori" description={errMsg(fetchError)} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Manajemen Kategori Program</h1>
        <p className="mt-1 text-sm text-slate-500">Konfigurasi pilar program kerja dan taksonomi pengelompokan artikel yayasan.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form */}
        <form onSubmit={handleSubmit} className="card h-fit p-6 lg:col-span-4 lg:sticky lg:top-20 lg:self-start">
          <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            {editingId ? 'Perbarui Data Kategori' : 'Registrasi Kategori Baru'}
          </h2>

          <label htmlFor="name" className="label mt-4">Nama Bidang / Kategori</label>
          <input id="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" placeholder="Contoh: Pendidikan" />

          <label htmlFor="description" className="label mt-4">Deskripsi Program</label>
          <textarea id="description" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input" placeholder="Uraian singkat ruang lingkup program (opsional)" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="icon" className="label">Ikon (FontAwesome)</label>
              <input id="icon" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} className="input" placeholder="fa-solid fa-graduation-cap" />
            </div>
            <div>
              <label htmlFor="sortOrder" className="label">Urutan</label>
              <input id="sortOrder" type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} className="input" />
            </div>
          </div>

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
          {categories.length === 0 ? (
            <EmptyState icon="fa-tags" title="Belum ada kategori" description="Tambahkan kategori pertama melalui formulir di samping." />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Nama</th>
                    <th className="px-5 py-3 font-semibold">Ikon</th>
                    <th className="px-5 py-3 font-semibold">Artikel</th>
                    <th className="px-5 py-3 font-semibold">Urutan</th>
                    <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="transition hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-800">{cat.name}</p>
                        {cat.description && <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{cat.description}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2 text-slate-500">
                          <FontAwesomeIcon icon={cat.icon ? cat.icon.split(' ') : ['fa-solid', 'fa-circle']} />
                          <code className="text-xs text-slate-400">{cat.icon}</code>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{cat._count?.posts ?? 0}</td>
                      <td className="px-5 py-3 text-slate-500">{cat.sortOrder}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => startEdit(cat)} className="btn-outline !px-3 !py-1.5 text-xs">
                            <FontAwesomeIcon icon={['fa-solid', 'fa-pen']} />
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === cat.id}
                            onClick={() => handleDelete(cat)}
                            className="btn-danger !px-3 !py-1.5 text-xs"
                          >
                            {deletingId === cat.id ? '…' : (
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
