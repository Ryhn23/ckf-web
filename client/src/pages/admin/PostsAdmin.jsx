import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getPosts, deletePost } from '../../api/posts';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/formatDate';

const PAGE_SIZE = 10;

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
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
            Artikel
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola artikel dan berita website.
          </p>
        </div>
        <Link to="/admin/posts/new" className="admin-btn-primary">
          <FontAwesomeIcon icon={['fa-solid', 'fa-plus']} />
          <span>Tulis Artikel</span>
        </Link>
      </div>

      {/* Filter & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="input !w-auto !py-2 text-xs font-medium"
          >
            <option value="">Semua Status</option>
            <option value="PUBLISHED">Terbit</option>
            <option value="DRAFT">Draft</option>
          </select>

          <div className="relative">
            <FontAwesomeIcon
              icon={['fa-solid', 'fa-magnifying-glass']}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input !py-2 pl-9 text-xs w-64 sm:w-80"
              placeholder="Cari judul artikel…"
            />
          </div>
        </div>

        {meta.total !== undefined && (
          <span className="text-xs font-medium text-slate-500">
            Total <strong className="text-slate-800 font-semibold">{meta.total}</strong> artikel
          </span>
        )}
      </div>

      {/* Tabel */}
      {posts.length === 0 ? (
        <EmptyState
          icon="fa-newspaper"
          title="Belum ada artikel"
          description="Klik tombol 'Tulis Artikel' untuk membuat artikel baru."
        />
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr>
                  <th className="admin-th">Judul</th>
                  <th className="admin-th">Kategori</th>
                  <th className="admin-th">Status</th>
                  <th className="admin-th">Dibaca</th>
                  <th className="admin-th">Tanggal</th>
                  <th className="admin-th text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((post) => (
                  <tr key={post.id} className="transition hover:bg-slate-50/70">
                    <td className="admin-td max-w-md xl:max-w-xl">
                      <Link
                        to={`/admin/posts/${post.id}/edit`}
                        className="line-clamp-2 font-semibold text-slate-800 hover:text-teal-700 transition"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="admin-td">
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {post.category?.name || 'Umum'}
                      </span>
                    </td>
                    <td className="admin-td">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="admin-td text-slate-600 font-medium">
                      <span className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={['fa-solid', 'fa-eye']} className="text-xs text-slate-400" />
                        {Number(post.views || 0).toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="admin-td whitespace-nowrap text-xs text-slate-500">
                      {formatDate(post.publishedAt || post.createdAt, 'd MMM yyyy')}
                    </td>
                    <td className="admin-td">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/posts/${post.id}/edit`}
                          className="admin-btn-secondary !px-2.5 !py-1 text-xs font-medium"
                          title="Edit Artikel"
                        >
                          <FontAwesomeIcon icon={['fa-solid', 'fa-pen']} className="text-xs" />
                          <span>Edit</span>
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === post.id}
                          onClick={() => handleDelete(post)}
                          className="admin-btn-danger !px-2.5 !py-1 text-xs font-medium"
                          title="Hapus Artikel"
                        >
                          {deletingId === post.id ? (
                            '…'
                          ) : (
                            <>
                              <FontAwesomeIcon icon={['fa-solid', 'fa-trash']} className="text-xs" />
                              <span>Hapus</span>
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
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 text-xs text-slate-500">
          <span>
            Halaman <strong className="text-slate-800">{meta.page}</strong> dari{' '}
            <strong className="text-slate-800">{meta.totalPages}</strong> (Total {meta.total} artikel)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="admin-btn-secondary !px-3 !py-1.5 text-xs font-medium"
            >
              ← Sebelumnya
            </button>
            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="admin-btn-secondary !px-3 !py-1.5 text-xs font-medium"
            >
              Berikutnya →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

