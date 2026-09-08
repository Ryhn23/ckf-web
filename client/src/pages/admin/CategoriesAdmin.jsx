import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/categories';
import { errMsg } from '../../api/client';
import { parseFaIcon, CATEGORY_ICON_PRESETS } from '../../utils/iconUtils';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const EMPTY_FORM = { name: '', description: '', icon: 'fa-solid fa-circle', sortOrder: 0, target: '', impact: '' };

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
    setForm({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || 'fa-solid fa-circle',
      sortOrder: cat.sortOrder || 0,
      target: cat.target || '',
      impact: cat.impact || '',
    });
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
        target: form.target.trim() || null,
        impact: form.impact.trim() || null,
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
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
            Kategori
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola kategori artikel dan program kerja.
          </p>
        </div>
      </div>

      {/* Grid 3 Ringkasan Metrik */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="admin-card p-4 transition-all hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-tags']} className="text-xs" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
          </div>
          <p className="mt-2.5 font-heading text-xl font-bold text-slate-900 truncate">
            {categories.length}
          </p>
          <p className="text-[11px] text-slate-400">Kategori terdaftar</p>
        </div>

        <div className="admin-card p-4 transition-all hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-newspaper']} className="text-xs" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Artikel</span>
          </div>
          <p className="mt-2.5 font-heading text-xl font-bold text-slate-900 truncate">
            {categories.reduce((acc, c) => acc + (c._count?.posts || 0), 0)}
          </p>
          <p className="text-[11px] text-slate-400">Total artikel tertaut</p>
        </div>

        <div className="admin-card p-4 transition-all hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-bullseye']} className="text-xs" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Program</span>
          </div>
          <p className="mt-2.5 font-heading text-xl font-bold text-slate-900 truncate">
            {categories.filter((c) => c.target || c.impact).length}
          </p>
          <p className="text-[11px] text-slate-400">Dengan target & capaian</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-card h-fit p-6 lg:col-span-4 lg:sticky lg:top-20 lg:self-start space-y-4">
          <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            {editingId ? 'Edit Kategori' : 'Tambah Kategori'}
          </h2>

          <div>
            <label htmlFor="name" className="label text-xs">Nama Kategori</label>
            <input id="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input text-xs" placeholder="Contoh: Pendidikan" />
          </div>

          <div>
            <label htmlFor="description" className="label text-xs">Deskripsi</label>
            <textarea id="description" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input text-xs" placeholder="Deskripsi singkat (opsional)" />
          </div>

          <div>
            <label htmlFor="target" className="label text-xs">Target Penerima</label>
            <input id="target" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} className="input text-xs" placeholder="Contoh: Pelajar dan santri" />
          </div>

          <div>
            <label htmlFor="impact" className="label text-xs">Dampak / Capaian</label>
            <input id="impact" value={form.impact} onChange={(e) => setForm((f) => ({ ...f, impact: e.target.value }))} className="input text-xs" placeholder="Contoh: 15 Sekolah, 3.200 Siswa" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="icon" className="label text-xs">Ikon</label>
              <input id="icon" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} className="input text-xs" placeholder="fa-solid fa-graduation-cap" />
            </div>
            <div>
              <label htmlFor="sortOrder" className="label text-xs">Urutan</label>
              <input id="sortOrder" type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} className="input text-xs" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1.5">Pilihan Ikon:</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_ICON_PRESETS.map((preset) => (
                <button
                  key={preset.icon}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, icon: preset.icon }))}
                  className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
                    form.icon === preset.icon
                      ? 'border-slate-900 bg-slate-900 text-white font-semibold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <FontAwesomeIcon icon={parseFaIcon(preset.icon)} className={`mr-1 ${form.icon === preset.icon ? 'text-slate-300' : 'text-slate-400'}`} />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700">
              <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} />
              {error}
            </p>
          )}

          <div className="pt-2 flex gap-2">
            <button type="submit" disabled={saving} className="admin-btn-primary flex-1 justify-center text-xs">
              {saving ? 'Menyimpan…' : editingId ? 'Simpan Perubahan' : 'Tambah Kategori'}
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
          {categories.length === 0 ? (
            <EmptyState icon="fa-tags" title="Belum ada kategori" description="Tambahkan kategori pertama melalui formulir di samping." />
          ) : (
            <div className="admin-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr>
                      <th className="admin-th">Nama Kategori</th>
                      <th className="admin-th">Ikon</th>
                      <th className="admin-th">Artikel</th>
                      <th className="admin-th">Urutan</th>
                      <th className="admin-th text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="transition hover:bg-slate-50/70">
                        <td className="admin-td">
                          <p className="font-semibold text-slate-900">{cat.name}</p>
                          {cat.description && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{cat.description}</p>}
                          {(cat.target || cat.impact) && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {cat.target && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                                  <span className="font-medium text-slate-500">Sasaran:</span> {cat.target}
                                </span>
                              )}
                              {cat.impact && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                  <span className="text-slate-500 font-semibold">Dampak:</span> {cat.impact}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="admin-td">
                          <span className="flex items-center gap-2 text-slate-600">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60">
                              <FontAwesomeIcon icon={parseFaIcon(cat.icon)} className="text-xs" />
                            </span>
                            <code className="text-xs text-slate-400">{cat.icon}</code>
                          </span>
                        </td>
                        <td className="admin-td text-slate-600 font-semibold">{cat._count?.posts ?? 0}</td>
                        <td className="admin-td text-slate-500">{cat.sortOrder}</td>
                        <td className="admin-td">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(cat)}
                              className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                              title="Edit Kategori"
                            >
                              <FontAwesomeIcon icon={['fa-solid', 'fa-pen']} />
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === cat.id}
                              onClick={() => handleDelete(cat)}
                              className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition shadow-2xs"
                              title="Hapus Kategori"
                            >
                              {deletingId === cat.id ? '…' : <FontAwesomeIcon icon={['fa-solid', 'fa-trash']} />}
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
