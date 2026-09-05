import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import useFetch from '../../hooks/useFetch';
import { getDashboardStats } from '../../api/stats';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/formatDate';

const CARDS = [
  { key: 'totalPosts', label: 'Total Publikasi Artikel', icon: 'fa-newspaper', color: 'bg-teal-50 text-teal-700' },
  { key: 'published', label: 'Telah Diterbitkan', icon: 'fa-circle-check', color: 'bg-emerald-50 text-emerald-700' },
  { key: 'drafts', label: 'Draf Dokumen', icon: 'fa-file-pen', color: 'bg-amber-50 text-amber-700' },
  { key: 'totalViews', label: 'Total Pembaca', icon: 'fa-eye', color: 'bg-sky-50 text-sky-700' },
];

const STATUS_BADGE = {
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
  DRAFT: 'bg-amber-100 text-amber-800',
};

export default function Dashboard() {
  const { data, loading, error } = useFetch(() => getDashboardStats(), []);

  if (loading) return <Spinner label="Memuat statistik…" />;
  if (error)
    return (
      <EmptyState
        icon="fa-triangle-exclamation"
        title="Gagal memuat statistik"
        description={errMsg(error)}
      />
    );

  const stats = data?.data || {};
  const chartData = (stats.viewsByCategory || []).map((r) => ({ ...r, name: r.category }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Dasbor Eksekutif</h1>
        <p className="mt-1 text-sm text-slate-500">Ringkasan metrik kinerja publikasi dan interaksi situs Yayasan Cinta Kasih Fatimah.</p>
      </div>

      {/* Kartu statistik */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c) => (
          <div key={c.key} className="card flex items-center gap-4 p-5">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg ${c.color}`}>
              <FontAwesomeIcon icon={['fa-solid', c.icon]} />
            </span>
            <div>
              <p className="text-sm text-slate-500">{c.label}</p>
              <p className="font-heading text-2xl font-bold text-slate-900">
                {Number(stats[c.key] || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Grafik views per kategori */}
        <div className="card p-6 lg:col-span-3">
          <h2 className="font-heading text-lg font-bold text-slate-900">Distribusi Pembaca per Bidang Program</h2>
          {chartData.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Belum ada data distribusi pembaca.</p>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="views" name="Tayangan" fill="#0f766e" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Artikel terbaru */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-slate-900">Publikasi Terkini</h2>
            <Link to="/admin/posts" className="text-sm font-semibold text-teal-700 hover:underline">
              Lihat seluruh arsip
            </Link>
          </div>
          {stats.recentPosts?.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Belum ada data publikasi artikel.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.recentPosts.map((post) => (
                <li key={post.id}>
                  <Link to={`/admin/posts/${post.id}/edit`} className="group block rounded-xl p-2 transition hover:bg-slate-50">
                    <p className="line-clamp-1 text-sm font-semibold text-slate-800 group-hover:text-teal-700">
                      {post.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${STATUS_BADGE[post.status] || 'bg-slate-100 text-slate-600'}`}>
                        {post.status === 'PUBLISHED' ? 'Terbit' : 'Draf'}
                      </span>
                      <span>{post.category?.name}</span>
                      <span>·</span>
                      <span>{formatDate(post.publishedAt || post.createdAt, 'd MMM yyyy')}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
