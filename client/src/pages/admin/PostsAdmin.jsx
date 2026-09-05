import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getPosts, deletePost } from '../../api/posts';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/formatDate';

const PAGE_SIZE = 10;

const STATUS_BADGE = {
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
  DRAFT: 'bg-amber-100 text-amber-800',
};

export default function PostsAdmin() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const { data, loading, error, refetch } = useFetch(
    () => getPosts({ page, limit: PAGE_SIZE, status: status || undefined, search: search || undefined }),
    [page, status, search],
  );

  const posts = data?.data || [];
  const meta = data?.meta || {};

  async function handleDelete(post) {
    if (!window.confirm(`Hapus artikel "${post.title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    setDeletingId(post.id);
    try {
      await deletePost(post.id);
      // Muat ulang halaman (total bisa berkurang → page mungkin out of range)
      if (posts.length === 1 && page > 1) setPage(page - 1);
      else refetch();
    } catch {
      /* abaikan */
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <Spinner label="Memuat artikel…" />;
  if (error) return <EmptyState icon="fa-triangle-exclamation" title="Gagal memuat artikel" description={errMsg(error)} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Artikel</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola artikel blog Cinta Kasih Fatimah.</p>
        </div>
        <Link to="/admin/posts/new" className="btn-primary">
          <FontAwesomeIcon icon={['fa-solid', 'fa-plus']} />
          Artikel Baru
        </Link>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input !w-auto">
          <option value="">Semua status</option>
          <option value="PUBLISHED">Terbit</option>
          <option value="DRAFT">Draf</option>
        </select>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input w-full sm:w-72"
          placeholder="Cari judul artikel…"
        />
      </div>

      {/* Tabel */}
      {posts.length === 0 ? (
        <EmptyState icon="fa-newspaper" title="Belum ada artikel" description="Mulai dengan membuat artikel pertama." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Judul</th>
                <th className="px-5 py-3 font-semibold">Kategori</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Tayangan</th>
                <th className="px-5 py-3 font-semibold">Tanggal</th>
                <th className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map((post) => (
                <tr key={post.id} className="transition hover:bg-slate-50/60">
                  <td className="max-w-md xl:max-w-xl px-5 py-3">
                    <Link to={`/admin/posts/${post.id}/edit`} className="line-clamp-2 font-semibold text-slate-800 hover:text-teal-700">
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{post.category?.name || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[post.status]}`}>
                      {post.status === 'PUBLISHED' ? 'Terbit' : 'Draf'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{Number(post.views || 0).toLocaleString('id-ID')}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-slate-500">
                    {formatDate(post.publishedAt || post.createdAt, 'd MMM yyyy')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <Link to={`/admin/posts/${post.id}/edit`} className="btn-outline !px-3 !py-1.5 text-xs">
                        <FontAwesomeIcon icon={['fa-solid', 'fa-pen']} />
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={deletingId === post.id}
                        onClick={() => handleDelete(post)}
                        className="btn-danger !px-3 !py-1.5 text-xs"
                      >
                        {deletingId === post.id ? '…' : (
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

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Halaman {meta.page} dari {meta.totalPages} · {meta.total} artikel
          </span>
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
    </div>
  );
}
