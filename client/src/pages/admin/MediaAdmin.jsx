import { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getMedia, uploadMedia, deleteMedia } from '../../api/media';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/formatDate';

const PAGE_SIZE = 12;

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaAdmin() {
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const fileRef = useRef(null);

  function copyUrl(item) {
    const fullUrl = item.url.startsWith('http') ? item.url : `${window.location.origin}${item.url}`;
    navigator.clipboard?.writeText(fullUrl).then(() => {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  }

  const { data, loading, error: fetchError, refetch } = useFetch(
    () => getMedia({ page, limit: PAGE_SIZE }),
    [page],
  );

  const media = data?.data || [];
  const meta = data?.meta || {};

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    setProgress(0);
    try {
      await uploadMedia(file, (evt) => {
        setProgress(evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0);
      });
      refetch();
    } catch (err) {
      setError(errMsg(err, 'Gagal mengunggah file'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus media "${item.originalName}"?`)) return;
    setDeletingId(item.id);
    try {
      await deleteMedia(item.id);
      if (media.length === 1 && page > 1) setPage(page - 1);
      else refetch();
    } catch {
      /* abaikan */
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <Spinner label="Memuat media…" />;
  if (fetchError) return <EmptyState icon="fa-triangle-exclamation" title="Gagal memuat media" description={errMsg(fetchError)} />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
            Pustaka Media & Berkas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Penyimpanan terpusat dokumentasi visual, materi publikasi, dan aset berkas kegiatan.
          </p>
        </div>
      </div>

      {/* Upload Box */}
      <form onSubmit={(e) => { e.preventDefault(); fileRef.current?.click(); }} className="admin-card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <label
            htmlFor="file"
            className={`flex flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-6 py-5 transition ${
              uploading ? 'border-teal-400 bg-teal-50/70' : 'border-slate-200 hover:border-teal-500 hover:bg-slate-50/70'
            }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
              <FontAwesomeIcon icon={['fa-solid', 'fa-cloud-arrow-up']} className="text-base" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {uploading ? `Mengunggah berkas… ${progress}%` : 'Pilih berkas dari perangkat'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Format didukung: JPG, PNG, GIF, WebP, PDF (Ukuran maksimal 2 MB)</p>
            </div>
          </label>
          <input ref={fileRef} id="file" type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUpload} />
        </div>
        {uploading && (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        {error && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-700">
            <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} />
            {error}
          </p>
        )}
      </form>

      {/* Grid media */}
      {media.length === 0 ? (
        <EmptyState icon="fa-images" title="Belum Ada Berkas Media" description="Unggah berkas dokumentasi atau materi pendukung melalui area di atas." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {media.map((item) => (
              <div key={item.id} className="admin-card group overflow-hidden flex flex-col justify-between">
                <div>
                  {item.mimeType.startsWith('image/') ? (
                    <img src={item.url} alt={item.originalName} className="aspect-video w-full object-cover border-b border-slate-100" loading="lazy" />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-slate-50 text-3xl text-slate-400 border-b border-slate-100">
                      <FontAwesomeIcon icon={['fa-solid', 'fa-file']} />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="line-clamp-1 text-xs font-bold text-slate-900" title={item.originalName}>
                      {item.originalName}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400 font-medium">
                      {formatSize(item.size)} · {formatDate(item.createdAt, 'd MMM yyyy')}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => copyUrl(item)}
                      className={`admin-btn-secondary flex-1 justify-center !px-2 !py-1 text-xs font-medium transition ${
                        copiedId === item.id ? '!border-emerald-300 !bg-emerald-50 !text-emerald-700 font-semibold' : ''
                      }`}
                      title="Salin tautan gambar"
                    >
                      <FontAwesomeIcon icon={['fa-solid', copiedId === item.id ? 'fa-check' : 'fa-copy']} className="text-xs" />
                      <span>{copiedId === item.id ? 'Tersalin!' : 'Salin URL'}</span>
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-btn-secondary !px-2.5 !py-1 text-xs font-medium"
                      title="Buka berkas di tab baru"
                    >
                      Buka
                    </a>
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item)}
                      className="admin-btn-danger !px-2.5 !py-1 text-xs font-medium"
                      title="Hapus media"
                    >
                      {deletingId === item.id ? '…' : (
                        <FontAwesomeIcon icon={['fa-solid', 'fa-trash']} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 text-xs text-slate-500">
              <span>
                Halaman <strong className="text-slate-800">{meta.page}</strong> dari{' '}
                <strong className="text-slate-800">{meta.totalPages}</strong> (Total {meta.total} file)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="admin-btn-secondary !px-3 !py-1 text-xs font-medium"
                >
                  ← Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="admin-btn-secondary !px-3 !py-1 text-xs font-medium"
                >
                  Berikutnya →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
