import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getDonations, updateDonationStatus, deleteDonation } from '../../api/donations';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/formatDate';

const PAGE_SIZE = 15;

const STATUS_META = {
  PENDING: { label: 'Menunggu', badge: 'bg-amber-100 text-amber-800' },
  PROCESSED: { label: 'Diproses', badge: 'bg-emerald-100 text-emerald-800' },
  REJECTED: { label: 'Ditolak', badge: 'bg-red-100 text-red-700' },
};

export default function DonationsAdmin() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const { data, loading, error, refetch } = useFetch(
    () => getDonations({ page, limit: PAGE_SIZE, status: status || undefined }),
    [page, status],
  );

  const donations = data?.data || [];
  const meta = data?.meta || {};

  async function changeStatus(donation, newStatus) {
    try {
      await updateDonationStatus(donation.id, newStatus);
      refetch();
    } catch {
      /* abaikan */
    }
  }

  async function handleDelete(donation) {
    if (!window.confirm(`Hapus donasi ${donation.reference}?`)) return;
    setDeletingId(donation.id);
    try {
      await deleteDonation(donation.id);
      if (donations.length === 1 && page > 1) setPage(page - 1);
      else refetch();
    } catch {
      /* abaikan */
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <Spinner label="Memuat donasi…" />;
  if (error) return <EmptyState icon="fa-triangle-exclamation" title="Gagal memuat donasi" description={errMsg(error)} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Donasi</h1>
        <p className="mt-1 text-sm text-slate-500">Kelola donasi yang masuk dari halaman publik.</p>
      </div>

      {/* Filter status */}
      <div className="flex flex-wrap gap-2">
        {[['', 'Semua'], ['PENDING', 'Menunggu'], ['PROCESSED', 'Diproses'], ['REJECTED', 'Ditolak']].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => { setStatus(value); setPage(1); }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              status === value ? 'bg-teal-700 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-teal-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {donations.length === 0 ? (
        <EmptyState icon="fa-hand-holding-heart" title="Belum ada donasi" description="Donasi dari halaman publik akan muncul di sini." />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Referensi</th>
                  <th className="px-5 py-3 font-semibold">Nama</th>
                  <th className="px-5 py-3 font-semibold">Nominal</th>
                  <th className="px-5 py-3 font-semibold">Tanggal</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.map((d) => (
                  <tr key={d.id} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{d.reference}</td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-800">{d.name}</p>
                      {d.email && <p className="text-xs text-slate-400">{d.email}</p>}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-800">
                      Rp {Number(d.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-500">{formatDate(d.createdAt, 'd MMM yyyy')}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_META[d.status].badge}`}>
                          {STATUS_META[d.status].label}
                        </span>
                        <select
                          value={d.status}
                          onChange={(e) => changeStatus(d, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 focus:border-teal-500 focus:outline-none"
                        >
                          <option value="PENDING">Menunggu</option>
                          <option value="PROCESSED">Diproses</option>
                          <option value="REJECTED">Ditolak</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={deletingId === d.id}
                          onClick={() => handleDelete(d)}
                          className="btn-danger !px-3 !py-1.5 text-xs"
                        >
                          {deletingId === d.id ? '…' : (
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

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Halaman {meta.page} dari {meta.totalPages} · {meta.total} donasi</span>
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
