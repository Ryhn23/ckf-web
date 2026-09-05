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
  const fileRef = useRef(null);

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
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Media</h1>
        <p className="mt-1 text-sm text-slate-500">Kelola gambar dan file yang diunggah.</p>
      </div>

      {/* Upload */}
      <form onSubmit={(e) => { e.preventDefault(); fileRef.current?.click(); }} className="card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <label
            htmlFor="file"
            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-6 py-5 transition ${
              uploading ? 'border-teal-400 bg-teal-50' : 'border-slate-300 hover:border-teal-400 hover:bg-teal-50/40'
            }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
              <FontAwesomeIcon icon={['fa-solid', 'fa-cloud-arrow-up']} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {uploading ? `Mengunggah… ${progress}%` : 'Klik untuk pilih file'}
              </p>
              <p className="text-xs text-slate-400">JPG, PNG, GIF, WebP, PDF — maks 2 MB</p>
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
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} />
            {error}
          </p>
        )}
      </form>

      {/* Grid media */}
      {media.length === 0 ? (
        <EmptyState icon="fa-images" title="Belum ada media" description="Unggah file pertama melalui formulir di atas." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {media.map((item) => (
              <div key={item.id} className="card group overflow-hidden">
                {item.mimeType.startsWith('image/') ? (
                  <img src={item.url} alt={item.originalName} className="aspect-video w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-slate-100 text-3xl text-slate-400">
                    <FontAwesomeIcon icon={['fa-solid', 'fa-file']} />
                  </div>
                )}
                <div className="p-4">
                  <p className="line-clamp-1 text-sm font-semibold text-slate-800" title={item.originalName}>
                    {item.originalName}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatSize(item.size)} · {formatDate(item.createdAt, 'd MMM yyyy')}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <a href={item.url} target="_blank" rel="noreferrer" className="btn-outline flex-1 justify-center !px-2 !py-1.5 text-xs">
                      Buka
                    </a>
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item)}
                      className="btn-danger !px-3 !py-1.5 text-xs"
                    >
                      {deletingId === item.id ? '…' : (
                        <>
                          <FontAwesomeIcon icon={['fa-solid', 'fa-trash']} />
                          Hapus
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Halaman {meta.page} dari {meta.totalPages} · {meta.total} file</span>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-outline !px-3 !py-1.5 text-xs">
                  Sebelumnya
                </button>
                <button type="button" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-outline !px-3 !py-1.5 text-xs">
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
