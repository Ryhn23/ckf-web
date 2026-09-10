import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getAdminPosts, deletePost } from '../../api/posts';
import { getDashboardStats } from '../../api/stats';
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

  const { data: statsData } = useFetch(() => getDashboardStats(), []);
  const stats = statsData?.data || {};

  const { data, loading, error, refetch } = useFetch(
    () => getAdminPosts({ page, limit: PAGE_SIZE, status: status || undefined, search: search || undefined }),
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

      {/* Grid 4 Ringkasan Metrik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => { setStatus(''); setPage(1); }}
          className="admin-card p-4 cursor-pointer transition-all hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-newspaper']} className="text-xs" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
          </div>
          <p className="mt-2.5 font-heading text-xl font-bold text-slate-900 truncate">
            {stats.totalPosts ?? meta.total ?? 0}
          </p>
          <p className="text-[11px] text-slate-400">Total seluruh naskah</p>
        </div>

        <div
          onClick={() => { setStatus('PUBLISHED'); setPage(1); }}
          className="admin-card p-4 cursor-pointer transition-all hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-circle-check']} className="text-xs" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terbit</span>
          </div>
          <p className="mt-2.5 font-heading text-xl font-bold text-slate-900 truncate">
            {stats.published ?? 0}
          </p>
          <p className="text-[11px] text-slate-400">Dapat dibaca publik</p>
        </div>

        <div
          onClick={() => { setStatus('DRAFT'); setPage(1); }}
          className="admin-card p-4 cursor-pointer transition-all hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-file-pen']} className="text-xs" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Draft</span>
          </div>
          <p className="mt-2.5 font-heading text-xl font-bold text-slate-900 truncate">
            {stats.drafts ?? 0}
          </p>
          <p className="text-[11px] text-slate-400">Naskah konsep</p>
        </div>

        <div className="admin-card p-4 transition-all hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-eye']} className="text-xs" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pembaca</span>
          </div>
          <p className="mt-2.5 font-heading text-xl font-bold text-slate-900 truncate">
            {Number(stats.totalViews || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-400">Total pembaca artikel</p>
        </div>
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
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/admin/posts/${post.id}/edit`}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                          title="Edit Artikel"
                        >
                          <FontAwesomeIcon icon={['fa-solid', 'fa-pen']} />
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === post.id}
                          onClick={() => handleDelete(post)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition shadow-2xs"
                          title="Hapus Artikel"
                        >
                          {deletingId === post.id ? (
                            '…'
                          ) : (
                            <FontAwesomeIcon icon={['fa-solid', 'fa-trash']} />
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

