import { useState, Fragment } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getDonations, updateDonationStatus, deleteDonation } from '../../api/donations';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/formatDate';

const PAGE_SIZE = 15;

export default function DonationsAdmin() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const { data, loading, error, refetch } = useFetch(
    () => getDonations({ page, limit: PAGE_SIZE, status: status || undefined }),
    [page, status],
  );

  const donations = data?.data || [];
  const meta = data?.meta || {};
  const summary = data?.summary || {};

  async function changeStatus(donation, newStatus) {
    try {
      await updateDonationStatus(donation.id, newStatus);
      refetch();
    } catch {
      /* abaikan */
    }
  }

  async function handleDelete(donation) {
    if (!window.confirm(`Hapus catatan donasi nomor referensi ${donation.reference}?`)) return;
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

  if (loading) return <Spinner label="Memuat data donasi…" />;
  if (error) return <EmptyState icon="fa-triangle-exclamation" title="Gagal memuat donasi" description={errMsg(error)} />;

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
            Donasi
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola dan verifikasi transaksi donasi masuk.
          </p>
        </div>
      </div>

      {/* Ringkasan Finansial */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="admin-card p-5">
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-sack-dollar']} className="text-base" />
            </span>
            <StatusBadge status="PROCESSED" label="Selesai" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Donasi Diterima</p>
            <p className="font-heading text-2xl font-black text-slate-900 mt-1">
              Rp {Number(summary.processedAmount || 0).toLocaleString('id-ID')}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">{summary.processedCount || 0} transaksi berhasil</p>
          </div>
        </div>

        <div
          onClick={() => { setStatus('PENDING'); setPage(1); }}
          className="admin-card-interactive cursor-pointer p-5"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-clock']} className="text-base" />
            </span>
            <StatusBadge status="PENDING" label="Menunggu" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Menunggu Verifikasi</p>
            <p className="font-heading text-2xl font-black text-slate-900 mt-1">
              {summary.pendingCount || 0} Transaksi
            </p>
            <p className="mt-1 text-xs font-semibold text-teal-700">Klik untuk filter →</p>
          </div>
        </div>

        <div className="admin-card p-5">
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-hand-holding-heart']} className="text-base" />
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Semua</span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Transaksi</p>
            <p className="font-heading text-2xl font-black text-slate-900 mt-1">
              {(summary.processedCount || 0) + (summary.pendingCount || 0) + (summary.rejectedCount || 0)} Transaksi
            </p>
            <p className="mt-1 text-xs text-slate-500">{summary.rejectedCount || 0} dibatalkan / tidak valid</p>
          </div>
        </div>
      </div>

      {/* Filter Segmented Controls */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200/80 pb-4">
        {[
          ['', 'Semua Status'],
          ['PENDING', 'Menunggu'],
          ['PROCESSED', 'Selesai'],
          ['REJECTED', 'Dibatalkan'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => { setStatus(value); setPage(1); }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              status === value
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-teal-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {donations.length === 0 ? (
        <EmptyState
          icon="fa-hand-holding-heart"
          title="Tidak Ada Catatan Donasi"
          description="Data konfirmasi donasi dari publik akan tercatat pada daftar ini."
        />
      ) : (
        <>
          <div className="admin-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="admin-th">Kode Referensi</th>
                    <th className="admin-th">Nama Donatur</th>
                    <th className="admin-th">Nominal Donasi</th>
                    <th className="admin-th">Tanggal</th>
                    <th className="admin-th">Status & Ubah</th>
                    <th className="admin-th text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donations.map((d) => (
                    <Fragment key={d.id}>
                      <tr className="transition hover:bg-slate-50/70">
                        <td className="admin-td">
                          <button
                            type="button"
                            onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                            className="flex items-center gap-2 font-mono text-xs font-bold text-teal-800 hover:underline"
                          >
                            <FontAwesomeIcon
                              icon={['fa-solid', expandedId === d.id ? 'fa-chevron-down' : 'fa-chevron-right']}
                              className="text-[10px] text-slate-400"
                            />
                            <span>{d.reference}</span>
                          </button>
                        </td>
                        <td className="admin-td">
                          <p className="font-semibold text-slate-900">{d.name}</p>
                          {d.email && <p className="text-xs text-slate-400">{d.email}</p>}
                        </td>
                        <td className="admin-td font-heading font-bold text-slate-900">
                          Rp {Number(d.amount).toLocaleString('id-ID')}
                        </td>
                        <td className="admin-td whitespace-nowrap text-xs text-slate-500">
                          {formatDate(d.createdAt, 'd MMM yyyy')}
                        </td>
                        <td className="admin-td">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={d.status} />
                            <select
                              value={d.status}
                              onChange={(e) => changeStatus(d, e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:border-teal-500 focus:outline-none"
                            >
                              <option value="PENDING">Menunggu</option>
                              <option value="PROCESSED">Selesai</option>
                              <option value="REJECTED">Ditolak</option>
                            </select>
                          </div>
                        </td>
                        <td className="admin-td">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                              className="admin-btn-secondary !px-2.5 !py-1 text-xs font-medium"
                              title="Lihat detail donasi"
                            >
                              Detail
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === d.id}
                              onClick={() => handleDelete(d)}
                              className="admin-btn-danger !px-2.5 !py-1 text-xs font-medium"
                              title="Hapus Catatan Donasi"
                            >
                              {deletingId === d.id ? (
                                '…'
                              ) : (
                                <FontAwesomeIcon icon={['fa-solid', 'fa-trash']} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === d.id && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid gap-4 sm:grid-cols-3 text-xs bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                              <div>
                                <p className="font-bold text-slate-400 uppercase tracking-wider">Kontak / WhatsApp</p>
                                <p className="mt-1 text-sm font-semibold text-slate-800">{d.phone || '—'}</p>
                                {d.phone && (
                                  <a
                                    href={`https://wa.me/${d.phone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1.5 inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:underline"
                                  >
                                    <FontAwesomeIcon icon={['fa-brands', 'fa-whatsapp']} />
                                    Hubungi Donatur via WA
                                  </a>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-400 uppercase tracking-wider">Peruntukan Program</p>
                                <p className="mt-1 text-sm font-semibold text-teal-800">{d.programId || 'Penyaluran Umum'}</p>
                              </div>
                              <div>
                                <p className="font-bold text-slate-400 uppercase tracking-wider">Pesan / Doa Donatur</p>
                                <p className="mt-1 text-xs italic text-slate-700 leading-relaxed">
                                  {d.message ? `"${d.message}"` : 'Tidak ada catatan doa khusus.'}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 text-xs text-slate-500">
              <span>
                Halaman <strong className="text-slate-800">{meta.page}</strong> dari{' '}
                <strong className="text-slate-800">{meta.totalPages}</strong> (Total {meta.total} donasi)
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

