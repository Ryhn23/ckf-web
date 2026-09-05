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

  // Hitung jumlah kata dan perkiraan waktu baca
  const textContent = form.content.replace(/<[^>]*>/g, ' ').trim();
  const wordCount = textContent ? textContent.split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const quillModules = {
    toolbar: [
      [{ header: [2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      [{ align: [] }],
      ['clean'],
    ],
  };

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
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
                {isNew ? 'Penyusunan Artikel Baru' : 'Penyuntingan Artikel'}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  form.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {form.status === 'PUBLISHED' ? 'Telah Diterbitkan' : 'Draf Dokumen'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              {isNew
                ? 'Penyusunan rilis berita resmi, liputan kegiatan, atau materi edukasi yayasan.'
                : `Nomor Identifikasi: ${id}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/posts" className="btn-outline !py-2 !px-4 text-xs sm:text-sm">
            Batalkan
          </Link>
          <button
            type="button"
            disabled={submitting || !categoriesReady}
            onClick={() => {
              set('status', 'DRAFT');
              setTimeout(() => {
                const submitBtn = document.getElementById('submit-post-btn');
                submitBtn?.click();
              }, 50);
            }}
            className="btn-outline !border-slate-300 !bg-slate-50 !py-2 !px-4 text-xs sm:text-sm hover:!bg-slate-100"
          >
            Simpan sebagai Draf
          </button>
          <button
            type="button"
            disabled={submitting || !categoriesReady}
            onClick={() => {
              set('status', 'PUBLISHED');
              setTimeout(() => {
                const submitBtn = document.getElementById('submit-post-btn');
                submitBtn?.click();
              }, 50);
            }}
            className="btn-primary !py-2 !px-5 text-xs sm:text-sm shadow-sm"
          >
            {submitting ? 'Menyimpan…' : isNew ? 'Publikasikan Sekarang' : 'Simpan & Perbarui'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm">
          <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} className="text-lg text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor Form Layout */}
      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-12">
        {/* Kolom Utama: Kanvas Menulis Luas */}
        <div className="space-y-6 lg:col-span-7 xl:col-span-8 2xl:col-span-9">
          <div className="card space-y-6 p-6 sm:p-8">
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
                placeholder="Masukkan judul artikel publikasi…"
              />
            </div>

            {/* Slug URL */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="slug" className="label">
                  Tautan Permanen (Slug URL)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    set('slug', slugify(form.title));
                    setSlugTouched(true);
                  }}
                  className="text-xs font-semibold text-teal-700 hover:underline"
                >
                  Generate Otomatis
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
                  Ikhtisar Singkat (Excerpt)
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
                placeholder="Tuliskan ikhtisar atau rangkuman pokok artikel untuk tampilan kartu publikasi dan optimasi mesin pencari (SEO)…"
              />
            </div>

            {/* Editor Konten Luas */}
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="content" className="label !mb-0 text-base font-bold text-slate-800">
                  Batang Tubuh Artikel <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                  <span>{wordCount} kata</span>
                  <span>·</span>
                  <span>Estimasi baca: ~{readingTime} menit</span>
                </div>
              </div>

              <ReactQuill
                theme="snow"
                className="quill-editor"
                value={form.content}
                onChange={(html) => set('content', html)}
                modules={quillModules}
                placeholder="Tuliskan naskah lengkap artikel, laporan kegiatan, atau materi edukasi di sini…"
              />

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <p>Panduan: Gunakan format Judul Bagian (H2 &amp; H3) untuk menstrukturkan topik bahasan secara sistematis.</p>
                <span className="hidden sm:inline">Modul Editor Naskah</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Samping: Pengaturan & Metadata (Sticky Rail) */}
        <div className="space-y-6 lg:col-span-5 xl:col-span-4 2xl:col-span-3 lg:sticky lg:top-20 lg:self-start">
          {/* Panel Publikasi */}
          <div className="card p-6">
            <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Status &amp; Visibilitas Publikasi
            </h2>

            <div className="mt-4">
              <label htmlFor="status" className="label">
                Status Dokumen
              </label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="input"
              >
                <option value="DRAFT">Draf Dokumen (Tersimpan Privat)</option>
                <option value="PUBLISHED">Terbit (Dapat Diakses Publik)</option>
              </select>
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
                  <span>Sematan Beranda Utama (Featured)</span>
                  <p className="text-xs font-normal text-slate-400 mt-0.5">
                    Artikel terpilih akan ditampilkan sebagai warta utama pada slider halaman muka.
                  </p>
                </div>
              </label>
            </div>

            <button
              id="submit-post-btn"
              type="submit"
              disabled={submitting || !categoriesReady}
              className="btn-primary mt-6 w-full justify-center !py-3 shadow-md"
            >
              {submitting ? 'Menyimpan…' : isNew ? 'Simpan Naskah Artikel' : 'Simpan Pembaruan Data'}
            </button>
          </div>

          {/* Panel Kategori & Tag */}
          <div className="card p-6">
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
          <div className="card p-6">
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
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
