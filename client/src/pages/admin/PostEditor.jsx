import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { createPost, updatePost, getPostById } from '../../api/posts';
import { getCategories } from '../../api/categories';
import { uploadMedia } from '../../api/media';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toDateTimeLocal(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  publishedAt: '',
};

export default function PostEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [existingCover, setExistingCover] = useState('');
  const [removedCover, setRemovedCover] = useState(false);
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
      publishedAt: toDateTimeLocal(p.publishedAt),
    });
    setExistingCover(p.coverImage || '');
    setRemovedCover(false);
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

  async function handleSave(statusOverride, e) {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    const targetStatus = statusOverride || form.status;

    if (!form.title.trim()) {
      setError('Judul artikel publikasi wajib diisi.');
      window.scrollTo(0, 0);
      return;
    }
    if (!form.categoryId) {
      setError('Silakan pilih salah satu kategori program untuk artikel ini.');
      window.scrollTo(0, 0);
      return;
    }
    if (!form.content || !form.content.replace(/<[^>]*>/g, '').trim()) {
      setError('Konten naskah artikel tidak boleh kosong.');
      window.scrollTo(0, 0);
      return;
    }

    const fd = new FormData();
    fd.append('title', form.title.trim());
    if (form.slug) fd.append('slug', form.slug.trim());
    fd.append('excerpt', form.excerpt || '');
    fd.append('content', form.content);
    fd.append('categoryId', form.categoryId);
    fd.append('status', targetStatus);
    fd.append('isFeatured', String(form.isFeatured));
    fd.append('tags', form.tags || '');
    if (form.publishedAt) {
      fd.append('publishedAt', new Date(form.publishedAt).toISOString());
    } else {
      fd.append('publishedAt', '');
    }
    if (coverFile) {
      fd.append('cover', coverFile);
    } else if (removedCover) {
      fd.append('removeCover', 'true');
    }

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

  const quillRef = useRef(null);

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const res = await uploadMedia(file);
        const url = res?.data?.url;
        if (url) {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', url);
            quill.setSelection(range.index + 1);
          }
        }
      } catch (err) {
        alert(errMsg(err, 'Gagal mengunggah gambar ke artikel'));
      }
    };
  }, []);

  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [2, 3, 4, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          [{ align: [] }],
          ['clean'],
        ],
        handlers: {
          image: handleImageUpload,
        },
      },
    }),
    [handleImageUpload],
  );

  const coverPreview = coverFile ? URL.createObjectURL(coverFile) : existingCover;

  // Hitung jumlah kata dan perkiraan waktu baca
  const textContent = (form.content || '').replace(/<[^>]*>/g, ' ').trim();
  const wordCount = textContent ? textContent.split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  if (!isNew && loadingPost) return <Spinner label="Memuat artikel…" />;
  if (!isNew && !postData?.data)
    return (
      <EmptyState
        icon="fa-file-circle-exclamation"
        title="Artikel tidak ditemukan"
        action={<Link to="/admin/posts" className="admin-btn-primary">Kembali ke daftar</Link>}
      />
    );

  return (
    <div className="w-full space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/posts"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-teal-500 hover:text-teal-700 shadow-sm"
            title="Kembali ke Daftar Artikel"
          >
            <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-left']} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                {isNew ? 'Tulis Artikel' : 'Edit Artikel'}
              </h1>
              <StatusBadge status={form.status} />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {isNew
                ? 'Tulis artikel atau berita untuk website.'
                : `ID: ${id}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/admin/posts" className="admin-btn-secondary !py-2 !px-4 text-xs sm:text-sm">
            Batal
          </Link>
          {!isNew && form.slug && (
            <a
              href={`/blog/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn-secondary !py-2 !px-4 text-xs sm:text-sm inline-flex items-center gap-1.5"
              title="Pratinjau Artikel di Tab Baru"
            >
              <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-up-right-from-square']} className="text-xs" />
              <span className="hidden sm:inline">Pratinjau</span>
            </a>
          )}
          <button
            type="button"
            disabled={submitting || !categoriesReady}
            onClick={() => handleSave('DRAFT')}
            className="admin-btn-secondary !py-2 !px-4 text-xs sm:text-sm"
          >
            Simpan Draft
          </button>
          <button
            type="button"
            disabled={submitting || !categoriesReady}
            onClick={() => handleSave('PUBLISHED')}
            className="admin-btn-primary !py-2 !px-5 text-xs sm:text-sm shadow-sm"
          >
            {submitting ? 'Menyimpan…' : isNew ? 'Publikasikan' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 shadow-sm">
          <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} className="text-lg text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor Form Layout */}
      <form onSubmit={(e) => handleSave(form.status, e)} className="grid gap-8 lg:grid-cols-12">
        {/* Kolom Utama: Kanvas Menulis Luas */}
        <div className="space-y-6 lg:col-span-7 xl:col-span-8 2xl:col-span-9">
          <div className="admin-card space-y-6 p-6 sm:p-8">
            {/* Judul Artikel */}
            <div>
              <label htmlFor="title" className="label text-base font-bold text-slate-800">
                Judul Artikel <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                required
                value={form.title}
                onChange={handleTitleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 font-heading text-lg sm:text-2xl font-bold text-slate-900 placeholder:text-slate-300 transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-600/10"
                placeholder="Masukkan judul artikel…"
              />
            </div>

            {/* Slug URL */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="slug" className="label">
                  Slug URL
                </label>
                <button
                  type="button"
                  onClick={() => {
                    set('slug', slugify(form.title));
                    setSlugTouched(true);
                  }}
                  className="text-xs font-semibold text-teal-700 hover:underline"
                >
                  Buat Otomatis
                </button>
              </div>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 transition focus-within:border-teal-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-600/20">
                <span className="text-xs sm:text-sm font-medium text-slate-400">/blog/</span>
                <input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set('slug', e.target.value);
                  }}
                  className="w-full border-0 bg-transparent px-2 py-1.5 text-xs sm:text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0"
                  placeholder="slug-artikel"
                />
              </div>
            </div>

            {/* Ringkasan (Excerpt) */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="excerpt" className="label">
                  Ringkasan (Excerpt)
                </label>
                <span className="text-xs font-medium text-slate-400">
                  {form.excerpt.length}/300 karakter
                </span>
              </div>
              <textarea
                id="excerpt"
                rows={3}
                maxLength={300}
                value={form.excerpt}
                onChange={(e) => set('excerpt', e.target.value)}
                className="input text-sm leading-relaxed"
                placeholder="Tulis ringkasan singkat artikel untuk preview dan SEO…"
              />
            </div>

            {/* Editor Konten Luas */}
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="content" className="label !mb-0 text-base font-bold text-slate-800">
                  Konten Artikel <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                  <span>{wordCount} kata</span>
                  <span>·</span>
                  <span>Estimasi baca: ~{readingTime} menit</span>
                </div>
              </div>

              <ReactQuill
                ref={quillRef}
                theme="snow"
                className="quill-editor"
                value={form.content}
                onChange={(html) => set('content', html)}
                modules={quillModules}
                placeholder="Tulis isi artikel di sini…"
              />

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <p>Tips: Gunakan heading H2 & H3 untuk membagi bagian artikel.</p>
                <span className="hidden sm:inline">Editor</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Samping: Pengaturan & Metadata (Sticky Rail) */}
        <div className="space-y-6 lg:col-span-5 xl:col-span-4 2xl:col-span-3 lg:sticky lg:top-20 lg:self-start">
          {/* Panel Publikasi */}
          <div className="admin-card p-6">
            <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Status Publikasi
            </h2>

            <div className="mt-4">
              <label htmlFor="status" className="label">
                Status
              </label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="input"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Terbit</option>
              </select>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label htmlFor="publishedAt" className="label !mb-0">
                  Tanggal Terbit
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => set('publishedAt', toDateTimeLocal(new Date()))}
                    className="text-xs font-semibold text-teal-700 hover:underline"
                  >
                    Sekarang
                  </button>
                  {form.publishedAt && (
                    <button
                      type="button"
                      onClick={() => set('publishedAt', '')}
                      className="text-xs font-semibold text-slate-400 hover:text-red-500 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <input
                id="publishedAt"
                type="datetime-local"
                value={form.publishedAt}
                onChange={(e) => set('publishedAt', e.target.value)}
                className="input mt-1.5 text-sm"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Atur tanggal terbit artikel atau kosongkan untuk waktu saat disimpan.
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <label className="flex cursor-pointer items-start gap-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => set('isFeatured', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-teal-700"
                />
                <div>
                  <span>Tampilkan di Beranda (Featured)</span>
                  <p className="text-xs font-normal text-slate-400 mt-0.5">
                    Artikel akan diprioritaskan tampil di slider beranda.
                  </p>
                </div>
              </label>
            </div>

            <button
              id="submit-post-btn"
              type="submit"
              disabled={submitting || !categoriesReady}
              className="admin-btn-primary mt-6 w-full justify-center !py-3 shadow-sm"
            >
              {submitting ? 'Menyimpan…' : isNew ? 'Simpan Artikel' : 'Simpan Perubahan'}
            </button>
          </div>

          {/* Panel Kategori & Tag */}
          <div className="admin-card p-6">
            <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Kategori &amp; Tag
            </h2>

            <div className="mt-4">
              <label htmlFor="categoryId" className="label">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                id="categoryId"
                required
                value={form.categoryId}
                onChange={(e) => set('categoryId', e.target.value)}
                className="input"
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label htmlFor="tags" className="label">
                Tag / Kata Kunci
              </label>
              <input
                id="tags"
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                className="input"
                placeholder="pendidikan, beasiswa, 2026"
              />
              <p className="mt-1.5 text-xs text-slate-400">Pisahkan beberapa tag dengan tanda koma (,).</p>
            </div>
          </div>

          {/* Panel Gambar Cover */}
          <div className="admin-card p-6">
            <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Gambar Sampul (Cover)
            </h2>

            {coverPreview ? (
              <div className="mt-4 space-y-3">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
                  <img src={coverPreview} alt="Cover Preview" className="h-full w-full object-cover" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {coverFile ? coverFile.name : 'Cover terpasang'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCoverFile(null);
                      setExistingCover('');
                      setRemovedCover(true);
                    }}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Hapus Cover
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-400">Belum ada gambar sampul.</p>
            )}

            <label
              htmlFor="cover"
              className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
                coverFile
                  ? 'border-teal-400 bg-teal-50/60 text-teal-700'
                  : 'border-slate-300 text-slate-500 hover:border-teal-400 hover:bg-teal-50/30'
              }`}
            >
              <FontAwesomeIcon icon={['fa-solid', 'fa-cloud-arrow-up']} className="text-2xl text-teal-600" />
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {coverFile ? 'Ganti file gambar' : 'Unggah gambar sampul'}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">JPG, PNG, WebP (Rasio 16:9 disarankan)</p>
              </div>
            </label>
            <input
              id="cover"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setCoverFile(f);
                if (f) setRemovedCover(false);
              }}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
