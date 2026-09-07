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
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/95 px-3.5 py-2.5 text-xs text-white shadow-xl backdrop-blur">
        <p className="font-semibold text-teal-300">{label}</p>
        <p className="mt-1 font-heading text-sm font-bold text-white">
          {Number(payload[0].value).toLocaleString('id-ID')}{' '}
          <span className="font-sans text-xs font-normal text-slate-300">pembaca</span>
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
    <div className="space-y-7">
      {/* Header Dashboard Eksekutif */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
              Dasbor Eksekutif
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Aktif
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Ikhtisar performa publikasi, pengelolaan program donasi, dan pelayanan sosial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/posts/new" className="admin-btn-primary">
            <FontAwesomeIcon icon={['fa-solid', 'fa-plus']} />
            <span>Tulis Artikel</span>
          </Link>
          <Link to="/admin/settings" className="admin-btn-secondary">
            <FontAwesomeIcon icon={['fa-solid', 'fa-sliders']} />
            <span className="hidden sm:inline">Pengaturan</span>
          </Link>
        </div>
      </div>

      {/* Baris 1: Metrik Publikasi & Jangkauan */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Publikasi & Jangkauan Warta
          </h2>
          <Link to="/admin/posts" className="text-xs font-semibold text-teal-700 hover:underline">
            Semua Artikel →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="admin-card p-5">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                <FontAwesomeIcon icon={['fa-solid', 'fa-eye']} className="text-base" />
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Total Akumulasi</span>
            </div>
            <div className="mt-4">
              <p className="font-heading text-2xl font-extrabold tracking-tight text-slate-900">
                {Number(stats.totalViews || 0).toLocaleString('id-ID')}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Total pembaca artikel publik
              </p>
            </div>
          </div>

          <div className="admin-card p-5">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <FontAwesomeIcon icon={['fa-solid', 'fa-circle-check']} className="text-base" />
              </span>
              <StatusBadge status="PUBLISHED" label="Terbit" />
            </div>
            <div className="mt-4">
              <p className="font-heading text-2xl font-extrabold tracking-tight text-slate-900">
                {Number(stats.published || 0).toLocaleString('id-ID')}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Dari {Number(stats.totalPosts || 0).toLocaleString('id-ID')} naskah publikasi
              </p>
            </div>
          </div>

          <div className="admin-card p-5">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                <FontAwesomeIcon icon={['fa-solid', 'fa-file-pen']} className="text-base" />
              </span>
              <StatusBadge status="DRAFT" label="Draf" />
            </div>
            <div className="mt-4">
              <p className="font-heading text-2xl font-extrabold tracking-tight text-slate-900">
                {Number(stats.drafts || 0).toLocaleString('id-ID')}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Menunggu peninjauan & rilis
              </p>
            </div>
          </div>

          <div className="admin-card p-5">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                <FontAwesomeIcon icon={['fa-solid', 'fa-images']} className="text-base" />
              </span>
              <Link to="/admin/media" className="text-xs font-semibold text-teal-700 hover:underline">
                Kelola
              </Link>
            </div>
            <div className="mt-4">
              <p className="font-heading text-2xl font-extrabold tracking-tight text-slate-900">
                {Number(stats.totalMedia || 0).toLocaleString('id-ID')}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Aset media dokumentasi terunggah
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Baris 2: Pelayanan Filantropi & Aspirasi */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Layanan Filantropi & Interaksi Publik
          </h2>
          <span className="text-xs text-slate-400">Verifikasi berkala</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            to="/admin/donations"
            className="admin-card-interactive p-5 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-sack-dollar']} className="text-base" />
                </span>
                {Number(stats.pendingDonations || 0) > 0 ? (
                  <StatusBadge status="PENDING" label={`${stats.pendingDonations} Verifikasi`} />
                ) : (
                  <span className="text-xs font-medium text-slate-400">Tervalidasi</span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Donasi Terverifikasi
                </p>
                <p className="font-heading text-2xl font-black text-slate-900 mt-1">
                  Rp {Number(stats.totalDonationAmount || 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>{stats.totalDonations || 0} transaksi donasi</span>
              <span className="font-semibold text-teal-700 group-hover:underline">Buka Data →</span>
            </div>
          </Link>

          <Link
            to="/admin/aid-requests"
            className="admin-card-interactive p-5 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-hand-holding-hand']} className="text-base" />
                </span>
                {Number(stats.pendingAidRequests || 0) > 0 ? (
                  <StatusBadge status="PENDING" label={`${stats.pendingAidRequests} Menunggu`} />
                ) : (
                  <span className="text-xs font-medium text-slate-400">Tertangani</span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Permintaan Bantuan
                </p>
                <p className="font-heading text-2xl font-black text-slate-900 mt-1">
                  {Number(stats.totalAidRequests || 0).toLocaleString('id-ID')}{' '}
                  <span className="font-sans text-base font-normal text-slate-500">Tiket</span>
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>Bantuan dana & logistik</span>
              <span className="font-semibold text-teal-700 group-hover:underline">Kelola Tiket →</span>
            </div>
          </Link>

          <Link
            to="/admin/contact"
            className="admin-card-interactive p-5 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-envelope']} className="text-base" />
                </span>
                {Number(stats.unreadMessages || 0) > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                    {stats.unreadMessages} Pesan Baru
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-400">Terbaca</span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pesan Masuk Publik
                </p>
                <p className="font-heading text-2xl font-black text-slate-900 mt-1">
                  {Number(stats.unreadMessages || 0).toLocaleString('id-ID')}{' '}
                  <span className="font-sans text-base font-normal text-slate-500">Belum dibaca</span>
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>Aspirasi & korespondensi</span>
              <span className="font-semibold text-teal-700 group-hover:underline">Buka Kotak Masuk →</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Baris 3: Visualisasi Distribusi & Publikasi Terkini */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Grafik views per kategori */}
        <div className="admin-card p-6 lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900">
                Distribusi Pembaca per Bidang Program
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Statistik intensitas pembaca berdasarkan klasifikasi artikel
              </p>
            </div>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              Data Real-time
            </span>
          </div>

          {chartData.length === 0 ? (
            <div className="flex h-72 flex-col items-center justify-center text-center">
              <FontAwesomeIcon icon={['fa-solid', 'fa-chart-simple']} className="text-3xl text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">Belum Ada Data Pembaca</p>
              <p className="text-xs text-slate-400 mt-0.5">Statistik akan muncul seiring dengan pembacaan artikel di situs publik.</p>
            </div>
          ) : (
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    interval={0}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="views"
                    name="Tayangan"
                    fill="#0f766e"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={44}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Artikel terbaru */}
        <div className="admin-card p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-heading text-base font-bold text-slate-900">Publikasi Terkini</h2>
                <p className="text-xs text-slate-500 mt-0.5">Warta dan berita yang baru diperbarui</p>
              </div>
              <Link to="/admin/posts" className="text-xs font-semibold text-teal-700 hover:underline">
                Semua
              </Link>
            </div>

            {stats.recentPosts?.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                Belum ada data publikasi artikel.
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {stats.recentPosts.map((post) => (
                  <li key={post.id} className="py-2.5 first:pt-1 last:pb-1">
                    <Link
                      to={`/admin/posts/${post.id}/edit`}
                      className="group block rounded-xl p-2 transition hover:bg-slate-50"
                    >
                      <p className="line-clamp-1 text-sm font-semibold text-slate-800 group-hover:text-teal-700">
                        {post.title}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                        <StatusBadge status={post.status} />
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

          <div className="border-t border-slate-100 pt-4 mt-4 text-center">
            <Link to="/admin/posts/new" className="text-xs font-semibold text-teal-700 hover:underline">
              + Buat Naskah Publikasi Baru
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

