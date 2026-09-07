import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import useFetch from '../../hooks/useFetch';
import { getDashboardStats } from '../../api/stats';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/formatDate';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-700/60 bg-slate-900/95 px-3 py-2 text-xs text-white shadow-lg backdrop-blur">
        <p className="font-semibold text-teal-300">{label}</p>
        <p className="mt-0.5 font-heading text-xs font-bold text-white">
          {Number(payload[0].value).toLocaleString('id-ID')}{' '}
          <span className="font-sans text-[11px] font-normal text-slate-300">pembaca</span>
        </p>
      </div>
    );
  }
  return null;
}

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
    <div className="space-y-4 sm:space-y-5">
      {/* Header Dashboard Compact */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 sm:pb-4">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Ringkasan performa dan aktivitas situs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/posts/new" className="admin-btn-primary !py-1.5 !px-3 text-xs">
            <FontAwesomeIcon icon={['fa-solid', 'fa-plus']} />
            <span>Tulis Artikel</span>
          </Link>
          <Link to="/admin/settings" className="admin-btn-secondary !py-1.5 !px-3 text-xs">
            <FontAwesomeIcon icon={['fa-solid', 'fa-sliders']} />
            <span className="hidden sm:inline">Pengaturan</span>
          </Link>
        </div>
      </div>

      {/* Grid 6 Ringkasan Metrik Compact */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Total Donasi */}
        <Link
          to="/admin/donations"
          className="admin-card-interactive p-3.5 sm:p-4 rounded-xl flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80 text-sm group-hover:bg-slate-200/60 group-hover:text-slate-800 transition">
              <FontAwesomeIcon icon={['fa-solid', 'fa-sack-dollar']} />
            </span>
            {Number(stats.pendingDonations || 0) > 0 && (
              <span className="rounded-full bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                {stats.pendingDonations} Menunggu
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="font-heading text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate">
              Rp {Number(stats.totalDonationAmount || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
              Total Donasi ({stats.totalDonations || 0})
            </p>
          </div>
        </Link>

        {/* Permintaan Bantuan */}
        <Link
          to="/admin/aid-requests"
          className="admin-card-interactive p-3.5 sm:p-4 rounded-xl flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80 text-sm group-hover:bg-slate-200/60 group-hover:text-slate-800 transition">
              <FontAwesomeIcon icon={['fa-solid', 'fa-hand-holding-hand']} />
            </span>
            {Number(stats.pendingAidRequests || 0) > 0 && (
              <span className="rounded-full bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                {stats.pendingAidRequests} Menunggu
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="font-heading text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              {Number(stats.totalAidRequests || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
              Permintaan Bantuan
            </p>
          </div>
        </Link>

        {/* Pesan Masuk */}
        <Link
          to="/admin/contact"
          className="admin-card-interactive p-3.5 sm:p-4 rounded-xl flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80 text-sm group-hover:bg-slate-200/60 group-hover:text-slate-800 transition">
              <FontAwesomeIcon icon={['fa-solid', 'fa-envelope']} />
            </span>
            {Number(stats.unreadMessages || 0) > 0 && (
              <span className="rounded-full bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                {stats.unreadMessages} Baru
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="font-heading text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              {Number(stats.unreadMessages || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
              Pesan Masuk
            </p>
          </div>
        </Link>

        {/* Total Pembaca */}
        <Link
          to="/admin/posts"
          className="admin-card-interactive p-3.5 sm:p-4 rounded-xl flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80 text-sm group-hover:bg-slate-200/60 group-hover:text-slate-800 transition">
              <FontAwesomeIcon icon={['fa-solid', 'fa-eye']} />
            </span>
          </div>
          <div className="mt-3">
            <p className="font-heading text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              {Number(stats.totalViews || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
              Total Pembaca
            </p>
          </div>
        </Link>

        {/* Artikel Terbit */}
        <Link
          to="/admin/posts"
          className="admin-card-interactive p-3.5 sm:p-4 rounded-xl flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80 text-sm group-hover:bg-slate-200/60 group-hover:text-slate-800 transition">
              <FontAwesomeIcon icon={['fa-solid', 'fa-newspaper']} />
            </span>
            {Number(stats.drafts || 0) > 0 && (
              <span className="rounded-full bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                {stats.drafts} Draft
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="font-heading text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              {Number(stats.published || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
              Artikel Terbit
            </p>
          </div>
        </Link>

        {/* Kategori */}
        <Link
          to="/admin/categories"
          className="admin-card-interactive p-3.5 sm:p-4 rounded-xl flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80 text-sm group-hover:bg-slate-200/60 group-hover:text-slate-800 transition">
              <FontAwesomeIcon icon={['fa-solid', 'fa-tags']} />
            </span>
          </div>
          <div className="mt-3">
            <p className="font-heading text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              {Number(stats.categoryCount || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
              Kategori Aktif
            </p>
          </div>
        </Link>
      </div>

      {/* Grafik & Artikel Terbaru Compact */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Grafik views per kategori */}
        <div className="admin-card p-3.5 sm:p-4 lg:col-span-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="font-heading text-sm font-bold text-slate-900">
                Pembaca per Kategori
              </h2>
              <p className="text-[11px] text-slate-400">
                Statistik tayangan berdasarkan kategori artikel
              </p>
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="flex flex-1 min-h-[170px] flex-col items-center justify-center text-center">
              <FontAwesomeIcon icon={['fa-solid', 'fa-chart-simple']} className="text-2xl text-slate-300 mb-1.5" />
              <p className="text-xs font-semibold text-slate-600">Belum Ada Data</p>
              <p className="text-[11px] text-slate-400">Data akan muncul setelah ada artikel yang dibaca.</p>
            </div>
          ) : (
            <div className="mt-2.5 flex-1 min-h-[175px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval={0}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="views"
                    name="Tayangan"
                    fill="#0f766e"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Artikel terbaru */}
        <div className="admin-card p-3.5 sm:p-4 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h2 className="font-heading text-sm font-bold text-slate-900">Artikel Terbaru</h2>
                <p className="text-[11px] text-slate-400">Baru diperbarui</p>
              </div>
              <Link to="/admin/posts" className="text-xs font-semibold text-teal-700 hover:underline">
                Semua →
              </Link>
            </div>

            {stats.recentPosts?.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Belum ada artikel.
              </div>
            ) : (
              <ul className="mt-1 divide-y divide-slate-100">
                {stats.recentPosts.slice(0, 4).map((post) => (
                  <li key={post.id} className="py-1.5 first:pt-1 last:pb-0">
                    <Link
                      to={`/admin/posts/${post.id}/edit`}
                      className="group block rounded-lg px-2 py-1 transition hover:bg-slate-50"
                    >
                      <p className="line-clamp-1 text-xs font-semibold text-slate-800 group-hover:text-teal-700">
                        {post.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                        {post.status !== 'PUBLISHED' && <StatusBadge status={post.status} />}
                        <span className="font-medium text-slate-500">{post.category?.name || 'Umum'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <FontAwesomeIcon icon={['fa-solid', 'fa-eye']} className="text-[10px]" />
                          {Number(post.views || 0).toLocaleString('id-ID')}
                        </span>
                        <span>•</span>
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
    </div>
  );
}
