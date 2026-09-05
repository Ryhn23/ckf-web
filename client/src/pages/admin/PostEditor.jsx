import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { createPost, updatePost, getPostById } from '../../api/posts';
import { getCategories } from '../../api/categories';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  excerpt: '',
  categoryId: '',
  status: 'DRAFT',
  isFeatured: false,
  tags: '',
  content: '',
};

export default function PostEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [existingCover, setExistingCover] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: catData } = useFetch(() => getCategories(), []);
  const categories = catData?.data || [];

  const { data: postData, loading: loadingPost } = useFetch(
    () => (isNew ? Promise.resolve(null) : getPostById(id)),
    [id],
  );

  // Isi form saat post dimuat
  useEffect(() => {
    if (!postData?.data) return;
    const p = postData.data;
    setForm({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt || '',
      categoryId: p.categoryId,
      status: p.status,
      isFeatured: !!p.isFeatured,
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
      content: p.content || '',
    });
    setExistingCover(p.coverImage || '');
    setSlugTouched(true);
  }, [postData]);

  const categoriesReady = !loadingPost;

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleTitleChange(e) {
    const title = e.target.value;
    setForm((f) => ({
      ...f,
      title,
      slug: slugTouched ? f.slug : slugify(title),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.categoryId || !form.content) {
      setError('Judul, kategori, dan konten wajib diisi.');
      return;
    }

    const fd = new FormData();
    fd.append('title', form.title.trim());
    fd.append('excerpt', form.excerpt);
    fd.append('content', form.content);
    fd.append('categoryId', form.categoryId);
    fd.append('status', form.status);
    fd.append('isFeatured', String(form.isFeatured));
    fd.append('tags', form.tags);
    if (coverFile) fd.append('cover', coverFile);

    setSubmitting(true);
    try {
      if (isNew) {
        await createPost(fd);
      } else {
        await updatePost(id, fd);
      }
      navigate('/admin/posts');
    } catch (err) {
      setError(errMsg(err, 'Gagal menyimpan artikel'));
      window.scrollTo(0, 0);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isNew && loadingPost) return <Spinner label="Memuat artikel…" />;
  if (!isNew && !postData?.data)
    return (
      <EmptyState
        icon="fa-file-circle-exclamation"
        title="Artikel tidak ditemukan"
        action={<Link to="/admin/posts" className="btn-primary">Kembali ke daftar</Link>}
      />
    );

  const coverPreview = coverFile ? URL.createObjectURL(coverFile) : existingCover;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">
            {isNew ? 'Artikel Baru' : 'Edit Artikel'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isNew ? 'Tulis artikel baru untuk blog Cinta Kasih Fatimah.' : 'Perbarui artikel yang sudah ada.'}
          </p>
        </div>
        <Link to="/admin/posts" className="btn-outline">
          <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-left']} />
          Daftar Artikel
        </Link>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} />
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Kolom utama */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <label htmlFor="title" className="label">Judul</label>
            <input id="title" required value={form.title} onChange={handleTitleChange} className="input" placeholder="Judul artikel…" />

            <label htmlFor="slug" className="label mt-4">Slug</label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-slate-400">/blog/</span>
              <input
                id="slug"
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); set('slug', e.target.value); }}
                className="input"
                placeholder="slug-artikel"
              />
            </div>

            <label htmlFor="excerpt" className="label mt-4">Ringkasan (muncul di kartu &amp; SEO)</label>
            <textarea id="excerpt" rows={3} maxLength={300} value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} className="input" placeholder="Ringkas isi artikel dalam 1–2 kalimat…" />

            <div className="mt-4">
              <label htmlFor="content" className="label">Konten</label>
              <ReactQuill
                theme="snow"
                value={form.content}
                onChange={(html) => set('content', html)}
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ header: [2, 3, false] }],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['blockquote', 'code-block'],
                    ['link', 'image'],
                    [{ align: [] }],
                    ['clean'],
                  ],
                }}
                placeholder="Tulis artikel di sini…"
              />
            </div>
          </div>
        </div>

        {/* Kolom samping */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-heading text-base font-bold text-slate-900">Publikasi</h2>

            <label htmlFor="status" className="label mt-4">Status</label>
            <select id="status" value={form.status} onChange={(e) => set('status', e.target.value)} className="input">
              <option value="DRAFT">Draf</option>
              <option value="PUBLISHED">Terbit</option>
            </select>

            <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="h-4 w-4 accent-teal-700" />
              Tampilkan di carousel beranda (featured)
            </label>

            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Tanggal terbit otomatis diisi saat status diubah menjadi Terbit.
            </p>
          </div>

          <div className="card p-6">
            <h2 className="font-heading text-base font-bold text-slate-900">Kategori &amp; Tag</h2>

            <label htmlFor="categoryId" className="label mt-4">Kategori</label>
            <select id="categoryId" required value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className="input">
              <option value="">Pilih kategori…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <label htmlFor="tags" className="label mt-4">Tag (pisahkan dengan koma)</label>
            <input id="tags" value={form.tags} onChange={(e) => set('tags', e.target.value)} className="input" placeholder="pendidikan, beasiswa" />
          </div>

          <div className="card p-6">
            <h2 className="font-heading text-base font-bold text-slate-900">Gambar Cover</h2>
            {coverPreview && (
              <img src={coverPreview} alt="Cover" className="mt-4 aspect-video w-full rounded-xl object-cover" />
            )}
            <label htmlFor="cover" className={`mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm font-semibold text-slate-500 transition hover:border-teal-400 hover:text-teal-700 ${coverFile ? 'border-teal-400 bg-teal-50 text-teal-700' : ''}`}>
              <FontAwesomeIcon icon={['fa-solid', 'fa-cloud-arrow-up']} />
              {coverFile ? coverFile.name : 'Pilih gambar (JPG/PNG, maks 2 MB)'}
            </label>
            <input id="cover" type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
            {existingCover && !coverFile && (
              <button type="button" onClick={() => setExistingCover('')} className="mt-3 text-xs font-semibold text-red-600 hover:underline">
                Hapus gambar cover saat ini
              </button>
            )}
          </div>

          <button type="submit" disabled={submitting || !categoriesReady} className="btn-primary w-full justify-center">
            {submitting ? 'Menyimpan…' : isNew ? 'Buat Artikel' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
