import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import {
  getAidRequests,
  updateAidRequestStatus,
  deleteAidRequest,
} from '../../api/aidRequests';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/formatDate';

const PAGE_SIZE = 15;

function cleanPhoneForWa(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  return cleaned;
}

export default function AidRequestsAdmin() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  // Modal / Detail state
  const [selectedItem, setSelectedItem] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { data, loading, error, refetch } = useFetch(
    () =>
      getAidRequests({
        page,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        q: activeQuery || undefined,
      }),
    [page, statusFilter, typeFilter, activeQuery],
  );

  const requests = data?.data || [];
  const meta = data?.meta || {};
  const summary = data?.summary || {};

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setActiveQuery(searchQuery.trim());
  };

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setNewStatus(item.status);
    setAdminNotes(item.adminNotes || '');
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setUpdating(true);
    try {
      await updateAidRequestStatus(selectedItem.id, {
        status: newStatus,
        adminNotes: adminNotes.trim() || null,
      });
      refetch();
      handleCloseDetail();
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Hapus permohonan bantuan tiket ${item.ticketNumber} dari ${item.institutionName}?`)) {
      return;
    }

    setDeletingId(item.id);
    try {
      await deleteAidRequest(item.id);
      if (selectedItem?.id === item.id) {
        handleCloseDetail();
      }
      if (requests.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        refetch();
      }
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && !data) return <Spinner label="Memuat data permohonan bantuan..." />;
  if (error) {
    return (
      <EmptyState
        icon="fa-triangle-exclamation"
        title="Gagal Memuat Permohonan"
        description={errMsg(error)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
            Permintaan Bantuan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola dan verifikasi permohonan bantuan dana atau barang.
          </p>
        </div>
      </div>

      {/* Counter Ringkasan */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-inbox']} className="text-xs" />
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total</span>
          </div>
          <p className="mt-3 font-heading text-2xl font-black text-slate-900">{summary.totalAll || 0}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {summary.danaCount || 0} Dana · {summary.barangCount || 0} Barang
          </p>
        </div>

        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-clock']} className="text-xs" />
            </span>
            <StatusBadge status="PENDING" label="Menunggu" />
          </div>
          <p className="mt-3 font-heading text-2xl font-black text-slate-900">{summary.pendingCount || 0}</p>
          <p className="mt-0.5 text-xs text-slate-400">Perlu dicek</p>
        </div>

        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-user-check']} className="text-xs" />
            </span>
            <StatusBadge status="REVIEWED" label="Ditinjau" />
          </div>
          <p className="mt-3 font-heading text-2xl font-black text-slate-900">{summary.reviewedCount || 0}</p>
          <p className="mt-0.5 text-xs text-slate-400">Sedang dicek</p>
        </div>

        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-circle-check']} className="text-xs" />
            </span>
            <StatusBadge status="APPROVED" label="Disetujui" />
          </div>
          <p className="mt-3 font-heading text-2xl font-black text-slate-900">{summary.approvedCount || 0}</p>
          <p className="mt-0.5 text-xs text-slate-400">Disetujui</p>
        </div>

        <div className="admin-card p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-ban']} className="text-xs" />
            </span>
            <StatusBadge status="REJECTED" label="Ditolak" />
          </div>
          <p className="mt-3 font-heading text-2xl font-black text-slate-900">{summary.rejectedCount || 0}</p>
          <p className="mt-0.5 text-xs text-slate-400">Ditolak</p>
        </div>
      </div>

      {/* Bar Filter & Toolbar */}
      <div className="admin-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <FontAwesomeIcon
                icon={['fa-solid', 'fa-magnifying-glass']}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tiket, lembaga, pimpinan, PJ..."
                className="input !py-2 pl-9 text-xs"
              />
            </div>
            <button type="submit" className="admin-btn-primary !px-3 !py-2 text-xs shrink-0">
              Cari
            </button>
            {activeQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveQuery('');
                  setPage(1);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
              >
                Reset
              </button>
            )}
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="input !py-2 text-xs w-auto min-w-[150px]"
            >
              <option value="">Semua Status</option>
              <option value="PENDING">Menunggu Verifikasi</option>
              <option value="REVIEWED">Sedang Ditinjau</option>
              <option value="APPROVED">Disetujui</option>
              <option value="REJECTED">Ditolak</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="input !py-2 text-xs w-auto min-w-[140px]"
            >
              <option value="">Semua Jenis</option>
              <option value="DANA">Bantuan Dana</option>
              <option value="BARANG">Bantuan Barang</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Permohonan */}
      {requests.length === 0 ? (
        <EmptyState
          icon="fa-inbox"
          title="Tidak Ada Data Permohonan"
          description={
            activeQuery || statusFilter || typeFilter
              ? 'Tidak ditemukan permohonan yang sesuai dengan filter pencarian.'
              : 'Belum ada permohonan bantuan yang diajukan oleh publik.'
          }
        />
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead>
                <tr>
                  <th className="admin-th">Tiket & Tanggal</th>
                  <th className="admin-th">Majelis / Lembaga</th>
                  <th className="admin-th">Bantuan & Kebutuhan</th>
                  <th className="admin-th">Pimpinan & PJ</th>
                  <th className="admin-th">Status</th>
                  <th className="admin-th text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((item) => {
                  const waLeader = cleanPhoneForWa(item.leaderPhone);
                  const waPic = cleanPhoneForWa(item.picPhone);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      {/* Tiket & Tanggal */}
                      <td className="admin-td">
                        <p className="font-mono font-bold text-teal-800 text-xs">{item.ticketNumber}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDate(item.createdAt, 'd MMM yyyy, HH:mm')}
                        </p>
                      </td>

                      {/* Majelis / Lembaga */}
                      <td className="admin-td max-w-[220px]">
                        <p className="font-bold text-slate-900 truncate" title={item.institutionName}>
                          {item.institutionName}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={item.reason}>
                          {item.reason}
                        </p>
                      </td>

                      {/* Bantuan & Kebutuhan */}
                      <td className="admin-td">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            item.type === 'DANA'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-teal-50 text-teal-800 border border-teal-200'
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={['fa-solid', item.type === 'DANA' ? 'fa-sack-dollar' : 'fa-box-open']}
                          />
                          {item.type === 'DANA' ? 'DANA' : 'BARANG'}
                        </span>
                        <p className="mt-1 font-semibold text-slate-800 truncate max-w-[180px]" title={item.amountOrGoods}>
                          {item.amountOrGoods}
                        </p>
                      </td>

                      {/* Pimpinan & PJ */}
                      <td className="admin-td">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-slate-400">Pimpinan:</span>
                            <span className="font-medium text-slate-800 truncate max-w-[110px]" title={item.leaderName}>
                              {item.leaderName}
                            </span>
                            {waLeader && (
                              <a
                                href={`https://wa.me/${waLeader}?text=${encodeURIComponent(
                                  `Assalamu'alaikum Bpk/Ibu ${item.leaderName}, kami dari tim Cinta Kasih Fatimah mengonfirmasi permohonan bantuan tiket ${item.ticketNumber} untuk ${item.institutionName}.`,
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Chat WhatsApp Pimpinan"
                                className="text-emerald-600 hover:text-emerald-700 ml-0.5"
                              >
                                <FontAwesomeIcon icon={['fa-brands', 'fa-whatsapp']} />
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-slate-400">PJ:</span>
                            <span className="font-medium text-slate-800 truncate max-w-[110px]" title={item.picName}>
                              {item.picName}
                            </span>
                            {waPic && (
                              <a
                                href={`https://wa.me/${waPic}?text=${encodeURIComponent(
                                  `Assalamu'alaikum Sdr/i ${item.picName} (PJ), kami dari tim Cinta Kasih Fatimah mengonfirmasi permohonan bantuan tiket ${item.ticketNumber} untuk ${item.institutionName}.`,
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Chat WhatsApp Penanggung Jawab"
                                className="text-emerald-600 hover:text-emerald-700 ml-0.5"
                              >
                                <FontAwesomeIcon icon={['fa-brands', 'fa-whatsapp']} />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="admin-td">
                        <StatusBadge status={item.status} />
                      </td>

                      {/* Aksi */}
                      <td className="admin-td text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(item)}
                            className="admin-btn-secondary !px-2.5 !py-1 text-xs font-medium"
                          >
                            Rincian
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item.id}
                            className="admin-btn-danger !px-2.5 !py-1 text-xs font-medium"
                            title="Hapus Permohonan"
                          >
                            <FontAwesomeIcon icon={['fa-solid', 'fa-trash']} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200/80 px-5 py-3.5 text-xs text-slate-500">
              <p>
                Menampilkan halaman <strong className="text-slate-800">{meta.page}</strong> dari{' '}
                <strong className="text-slate-800">{meta.totalPages}</strong> (Total {meta.total} data)
              </p>
              <div className="flex items-center gap-2">
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
                  Selanjutnya →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DETAIL & EDIT STATUS */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="admin-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-6 shadow-2xl">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-200/80 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-lg font-bold text-teal-800">
                    {selectedItem.ticketNumber}
                  </span>
                  <StatusBadge status={selectedItem.status} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Diajukan pada {formatDate(selectedItem.createdAt, "d MMMM yyyy, 'pukul' HH:mm")} WIB
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <FontAwesomeIcon icon={['fa-solid', 'fa-xmark']} className="text-base" />
              </button>
            </div>

            {/* Rincian Permohonan */}
            <div className="grid gap-4 text-xs sm:grid-cols-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className="font-semibold text-slate-500">Nama Majelis / Lembaga:</span>
                <p className="mt-0.5 text-sm font-bold text-slate-900">{selectedItem.institutionName}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Bentuk & Kebutuhan:</span>
                <p className="mt-0.5 text-sm font-bold text-teal-800">
                  [{selectedItem.type === 'DANA' ? 'Dana Tunai' : 'Barang'}] {selectedItem.amountOrGoods}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-500">Pimpinan:</span>
                <p className="mt-0.5 text-slate-900 font-medium">
                  {selectedItem.leaderName}
                </p>
                <a
                  href={`https://wa.me/${cleanPhoneForWa(selectedItem.leaderPhone)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 text-emerald-700 font-semibold hover:underline"
                >
                  <FontAwesomeIcon icon={['fa-brands', 'fa-whatsapp']} />
                  {selectedItem.leaderPhone} (Chat WA)
                </a>
              </div>

              <div>
                <span className="font-semibold text-slate-500">Penanggung Jawab (PJ):</span>
                <p className="mt-0.5 text-slate-900 font-medium">
                  {selectedItem.picName}
                </p>
                <a
                  href={`https://wa.me/${cleanPhoneForWa(selectedItem.picPhone)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 text-emerald-700 font-semibold hover:underline"
                >
                  <FontAwesomeIcon icon={['fa-brands', 'fa-whatsapp']} />
                  {selectedItem.picPhone} (Chat WA)
                </a>
              </div>
            </div>

            {/* Alasan / Penjelasan Pemohon */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Alasan & Penjelasan Kebutuhan Bantuan:
              </h4>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-700 whitespace-pre-line max-h-48 overflow-y-auto">
                {selectedItem.reason}
              </div>
            </div>

            {/* Form Ubah Status & Catatan Verifikasi */}
            <form onSubmit={handleStatusSubmit} className="border-t border-slate-200/80 pt-4 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Verifikasi & Keputusan Status:
              </h4>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="modalStatus" className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Permohonan
                  </label>
                  <select
                    id="modalStatus"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="PENDING">Menunggu Verifikasi (PENDING)</option>
                    <option value="REVIEWED">Sedang Ditinjau (REVIEWED)</option>
                    <option value="APPROVED">Disetujui (APPROVED)</option>
                    <option value="REJECTED">Ditolak (REJECTED)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="adminNotes" className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Internal Admin / Alasan Verifikasi
                  </label>
                  <input
                    type="text"
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Contoh: Sudah verifikasi via WA, menunggu jadwal penyaluran."
                    className="input text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedItem)}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold transition"
                >
                  Hapus Permohonan Ini
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseDetail}
                    className="admin-btn-secondary !px-4 !py-2 text-xs"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="admin-btn-primary !px-4 !py-2 text-xs font-bold"
                  >
                    {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
