import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getCustomFormSubmissions,
  updateCustomFormSubmission,
  deleteCustomFormSubmission,
  clearCustomFormSubmissions,
  exportCustomFormSubmissions,
} from '../../api/customForms';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/formatDate';

export default function CustomFormSubmissionsAdmin() {
  const { id: formId } = useParams();

  const [form, setForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ TOTAL: 0, BARU: 0, DIPROSES: 0, SELESAI: 0 });
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Export State
  const [exporting, setExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Detail Modal State
  const [selectedSub, setSelectedSub] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailStatus, setDetailStatus] = useState('BARU');
  const [detailNotes, setDetailNotes] = useState('');
  const [savingDetail, setSavingDetail] = useState(false);

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState(null);

  async function fetchSubmissions() {
    setLoading(true);
    setError(null);
    try {
      const res = await getCustomFormSubmissions(formId, {
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      });
      setForm(res.form || null);
      setSubmissions(res.data || []);
      setMeta(res.meta || { page: 1, limit: 20, total: 0, totalPages: 1 });
      if (res.statusCounts) setStatusCounts(res.statusCounts);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubmissions();
  }, [formId, page, statusFilter, search]);

  function handleSearchSubmit(e) {
    e?.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  // Handle Export to Excel
  async function handleExport() {
    if (!form) return;
    setExporting(true);
    try {
      await exportCustomFormSubmissions(form.id);
    } catch (err) {
      alert(errMsg(err, 'Gagal mengekspor data formulir ke Excel'));
    } finally {
      setExporting(false);
    }
  }

  // Handle Copy shareable URL
  function handleCopyShareLink() {
    if (!form?.slug) return;
    const url = `${window.location.origin}/form/${form.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  // Open Detail Modal
  function handleOpenDetail(sub) {
    setSelectedSub(sub);
    setDetailStatus(sub.status || 'BARU');
    setDetailNotes(sub.adminNotes || '');
    setDetailModalOpen(true);
  }

  // Save changes from Detail Modal
  async function handleSaveDetail() {
    if (!selectedSub) return;
    setSavingDetail(true);
    try {
      const res = await updateCustomFormSubmission(selectedSub.id, {
        status: detailStatus,
        adminNotes: detailNotes,
      });

      // Update local state
      setSubmissions((prev) =>
        prev.map((s) => (s.id === selectedSub.id ? { ...s, status: detailStatus, adminNotes: detailNotes } : s)),
      );
      setSelectedSub(res.data);
      setDetailModalOpen(false);
      // Refresh status counts
      fetchSubmissions();
    } catch (err) {
      alert(errMsg(err, 'Gagal memperbarui data respon'));
    } finally {
      setSavingDetail(false);
    }
  }

  // Delete single submission
  async function handleDeleteSubmission(subId) {
    const conf = window.confirm(
      `Apakah Anda yakin ingin menghapus data respon dengan ID "${subId}"?\n\n` +
      `Catatan: Tindakan ini HANYA menghapus 1 data respon peserta ini saja. Formulir utama "${form?.title || ''}" akan tetap aman dan aktif.`,
    );
    if (!conf) return;

    try {
      await deleteCustomFormSubmission(subId);
      if (detailModalOpen) setDetailModalOpen(false);
      fetchSubmissions();
    } catch (err) {
      alert(errMsg(err, 'Gagal menghapus respon'));
    }
  }

  // Clear all submissions for this form without deleting the form
  async function handleClearAllSubmissions() {
    if (!form || submissions.length === 0) return;
    const totalCount = statusCounts.TOTAL || meta.total || submissions.length;
    const conf = window.confirm(
      `PERINGATAN: Apakah Anda yakin ingin mengosongkan / menghapus SEMUA respon (${totalCount} data) untuk formulir "${form.title}"?\n\n` +
      `CATATAN PENTING:\nFormulir utama akan TETAP AMAN dan AKTIF. Hanya data respon peserta yang akan dihapus permanen.`,
    );
    if (!conf) return;

    try {
      await clearCustomFormSubmissions(formId);
      fetchSubmissions();
      alert('Semua data respon formulir berhasil dikosongkan.');
    } catch (err) {
      alert(errMsg(err, 'Gagal mengosongkan respon'));
    }
  }

  const fields = Array.isArray(form?.fields) ? form.fields : [];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/admin/custom-forms" className="hover:text-slate-800 transition-colors flex items-center gap-1">
              <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-left']} className="text-[10px]" />
              <span>Daftar Formulir Kustom</span>
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-700">{form?.title || 'Respon Formulir'}</span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>{form?.title || 'Respon Formulir'}</span>
            {form && (
              <StatusBadge status={form.isActive ? 'AKTIF' : 'NONAKTIF'} />
            )}
          </h1>
          {form?.description && (
            <p className="mt-1 text-xs text-slate-500 max-w-2xl">{form.description}</p>
          )}
        </div>

        {/* Action Buttons: Copy link & Export to Excel */}
        <div className="flex flex-wrap items-center gap-2.5">
          {form?.slug && (
            <>
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="admin-btn-secondary text-xs flex items-center gap-1.5"
                title="Salin link publik formulir"
              >
                <FontAwesomeIcon icon={['fa-solid', copiedLink ? 'fa-check' : 'fa-copy']} />
                <span>{copiedLink ? 'Link Tersalin!' : 'Salin Link Form'}</span>
              </button>
              <a
                href={`/form/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn-ghost text-xs flex items-center gap-1.5 text-slate-600 hover:text-slate-900"
                title="Buka tampilan formulir"
              >
                <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-up-right-from-square']} />
                <span>Buka Form</span>
              </a>
            </>
          )}

          {/* CLEAR ALL SUBMISSIONS BUTTON */}
          {submissions.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllSubmissions}
              className="admin-btn-secondary text-xs flex items-center gap-1.5 text-rose-600 hover:text-rose-700 hover:border-rose-300"
              title="Kosongkan seluruh respon peserta tanpa menghapus formulir utama"
            >
              <FontAwesomeIcon icon={['fa-solid', 'fa-trash-can']} />
              <span>Kosongkan Respon</span>
            </button>
          )}

          {/* EXCEL EXPORT BUTTON */}
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || submissions.length === 0}
            className="admin-btn-primary text-xs flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <FontAwesomeIcon
              icon={['fa-solid', exporting ? 'fa-spinner' : 'fa-file-excel']}
              className={exporting ? 'fa-spin' : 'text-xs'}
            />
            <span>{exporting ? 'Membuat Excel…' : 'Export Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* 4 Status Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => { setStatusFilter(''); setPage(1); }}
          className={`admin-card p-4 cursor-pointer transition-all ${
            statusFilter === '' ? 'ring-1 ring-slate-900 border-slate-900/40' : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-inbox']} className="text-xs" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
          </div>
          <p className="mt-2.5 font-heading text-xl font-bold text-slate-900 truncate">
            {statusCounts.TOTAL}
          </p>
          <p className="text-[11px] text-slate-400">Seluruh respon masuk</p>
        </div>

        <div
          onClick={() => { setStatusFilter('BARU'); setPage(1); }}
          className={`admin-card p-4 cursor-pointer transition-all ${
            statusFilter === 'BARU' ? 'ring-1 ring-slate-900 border-slate-900/40' : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-circle-info']} className="text-xs" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Baru</span>
          </div>
          <p className="mt-2.5 font-heading text-xl font-bold text-slate-900 truncate">
            {statusCounts.BARU}
          </p>
          <p className="text-[11px] text-slate-400">Belum diproses</p>
        </div>

        <div
          onClick={() => { setStatusFilter('DIPROSES'); setPage(1); }}
          className={`admin-card p-4 cursor-pointer transition-all ${
            statusFilter === 'DIPROSES' ? 'ring-1 ring-slate-900 border-slate-900/40' : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-clock']} className="text-xs" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diproses</span>
          </div>
          <p className="mt-2.5 font-heading text-xl font-bold text-slate-900 truncate">
            {statusCounts.DIPROSES}
          </p>
          <p className="text-[11px] text-slate-400">Sedang ditindaklanjuti</p>
        </div>

        <div
          onClick={() => { setStatusFilter('SELESAI'); setPage(1); }}
          className={`admin-card p-4 cursor-pointer transition-all ${
            statusFilter === 'SELESAI' ? 'ring-1 ring-slate-900 border-slate-900/40' : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-circle-check']} className="text-xs" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selesai</span>
          </div>
          <p className="mt-2.5 font-heading text-xl font-bold text-slate-900 truncate">
            {statusCounts.SELESAI}
          </p>
          <p className="text-[11px] text-slate-400">Tuntas ditangani</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
          <div className="flex items-center gap-1.5">
            {[
              { label: 'Semua', val: '' },
              { label: 'Baru', val: 'BARU' },
              { label: 'Diproses', val: 'DIPROSES' },
              { label: 'Selesai', val: 'SELESAI' },
            ].map((st) => (
              <button
                key={st.val}
                type="button"
                onClick={() => { setStatusFilter(st.val); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === st.val
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari ID Pendaftaran..."
              className="admin-input py-1.5 pl-8 pr-7 text-xs w-full font-mono placeholder:font-sans"
            />
            <FontAwesomeIcon
              icon={['fa-solid', 'fa-magnifying-glass']}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 text-xs"
                title="Hapus pencarian"
              >
                <FontAwesomeIcon icon={['fa-solid', 'fa-xmark']} />
              </button>
            )}
          </form>

          <button
            onClick={fetchSubmissions}
            className="admin-btn-ghost px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
            title="Muat ulang"
          >
            <FontAwesomeIcon icon={['fa-solid', 'fa-arrows-rotate']} className="mr-1" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Submissions Table */}
      {loading ? (
        <Spinner label="Memuat respon formulir…" />
      ) : error ? (
        <EmptyState icon="fa-triangle-exclamation" title="Gagal memuat respon" description={error} />
      ) : submissions.length === 0 ? (
        <EmptyState
          icon="fa-inbox"
          title="Belum ada respon masuk"
          description="Respon yang dikirimkan oleh publik melalui link formulir akan muncul di tabel ini."
        />
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="admin-th w-12 text-center">No</th>
                  <th className="admin-th whitespace-nowrap">ID Pendaftaran</th>
                  <th className="admin-th whitespace-nowrap">Tanggal Masuk</th>
                  {/* Dynamic first 3 field headers */}
                  {fields.slice(0, 3).map((f) => (
                    <th key={f.id} className="admin-th">
                      {f.label}
                    </th>
                  ))}
                  <th className="admin-th text-center">Berkas / Foto</th>
                  <th className="admin-th text-center">Status</th>
                  <th className="admin-th text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {submissions.map((sub, index) => {
                  const subData = sub.data || {};
                  const rowNum = (meta.page - 1) * meta.limit + index + 1;

                  // Find if there is any image upload
                  const imageField = fields.find((f) => f.type === 'image' || f.type === 'file');
                  const imageUrl = imageField ? subData[imageField.id] : null;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="admin-td text-center text-xs font-mono text-slate-400">
                        {rowNum}
                      </td>

                      <td className="admin-td whitespace-nowrap">
                        <span
                          className="font-mono text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200/90 px-2.5 py-1 rounded-md tracking-wider inline-flex items-center gap-1.5 shadow-2xs select-all transition-colors cursor-copy"
                          title="Klik/seleksi untuk menyalin ID Pendaftaran"
                        >
                          <FontAwesomeIcon icon={['fa-solid', 'fa-id-card']} className="text-[11px] text-slate-400" />
                          {sub.id}
                        </span>
                      </td>

                      <td className="admin-td whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-900">
                          {formatDate(sub.createdAt)}
                        </div>
                      </td>

                      {/* Display values for first 3 fields */}
                      {fields.slice(0, 3).map((f) => {
                        const val = subData[f.id];
                        let displayVal = '-';
                        if (Array.isArray(val)) {
                          displayVal = val.join(', ') || '-';
                        } else if (val) {
                          displayVal = String(val);
                        }

                        return (
                          <td key={f.id} className="admin-td max-w-[180px]">
                            <span className="text-xs text-slate-700 line-clamp-2" title={displayVal}>
                              {displayVal}
                            </span>
                          </td>
                        );
                      })}

                      {/* Image / Attachment preview */}
                      <td className="admin-td text-center">
                        {imageUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(imageUrl)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                            title="Lihat foto lampiran"
                          >
                            <FontAwesomeIcon icon={['fa-solid', 'fa-image']} className="text-xs text-slate-500" />
                            <span>Lihat Foto</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="admin-td text-center">
                        <StatusBadge status={sub.status} />
                      </td>

                      {/* Action buttons */}
                      <td className="admin-td text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(sub)}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                            title="Rincian Respon"
                          >
                            <FontAwesomeIcon icon={['fa-solid', 'fa-eye']} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubmission(sub.id)}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition shadow-2xs"
                            title={`Hapus Respon Peserta (ID: ${sub.id}) - Formulir utama tetap aman`}
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
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200/80 bg-slate-50/40 text-xs text-slate-500">
              <div>
                Halaman {meta.page} dari {meta.totalPages} ({meta.total} respon)
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="admin-btn-ghost px-2.5 py-1 disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
                  className="admin-btn-ghost px-2.5 py-1 disabled:opacity-40"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAIL INSPECTION MODAL */}
      <AnimatePresence>
        {detailModalOpen && selectedSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
                <div>
                  <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FontAwesomeIcon icon={['fa-solid', 'fa-file-lines']} className="text-slate-600" />
                    <span>Rincian Respon Responden</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200/90 px-2 py-0.5 rounded shadow-2xs select-all">
                      ID Pendaftaran: {selectedSub.id}
                    </span>
                    <span className="text-xs text-slate-500">
                      • Dikirim pada: {formatDate(selectedSub.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
                >
                  <FontAwesomeIcon icon={['fa-solid', 'fa-xmark']} className="text-base" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {/* Answers List */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">
                    Data Pertanyaan & Jawaban
                  </h3>

                  {fields.map((field) => {
                    const val = selectedSub.data?.[field.id];
                    const isImage = field.type === 'image' || field.type === 'file';

                    return (
                      <div key={field.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                        <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                          {field.label}
                        </span>

                        {isImage ? (
                          val ? (
                            <div className="mt-2 space-y-2">
                              <div className="relative max-w-xs h-44 rounded-lg overflow-hidden border border-slate-200 bg-slate-900/5 group">
                                <img
                                  src={val}
                                  alt={field.label}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImage(val)}
                                    className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-semibold shadow"
                                  >
                                    Perbesar Foto
                                  </button>
                                  <a
                                    href={val}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold shadow"
                                  >
                                    Buka File
                                  </a>
                                </div>
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono block">
                                Lokasi berkas: {val}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs italic text-slate-400">Tidak ada berkas diunggah</span>
                          )
                        ) : Array.isArray(val) ? (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {val.length > 0 ? (
                              val.map((item, i) => (
                                <span
                                  key={i}
                                  className="text-xs font-medium bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200"
                                >
                                  {item}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs italic text-slate-400">-</span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-slate-900 whitespace-pre-wrap">
                            {val || <span className="italic text-slate-400">-</span>}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Status & Admin Notes Form */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Tindak Lanjut & Status Admin
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Ubah Status
                      </label>
                      <select
                        value={detailStatus}
                        onChange={(e) => setDetailStatus(e.target.value)}
                        className="admin-select w-full text-xs"
                      >
                        <option value="BARU">BARU</option>
                        <option value="DIPROSES">DIPROSES</option>
                        <option value="SELESAI">SELESAI</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Catatan Admin (Internal)
                      </label>
                      <textarea
                        rows={2}
                        value={detailNotes}
                        onChange={(e) => setDetailNotes(e.target.value)}
                        placeholder="Tambahkan catatan internal terkait tindak lanjut respon ini…"
                        className="admin-input w-full text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/80">
                <button
                  type="button"
                  onClick={() => handleDeleteSubmission(selectedSub.id)}
                  className="admin-btn-ghost text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={['fa-solid', 'fa-trash']} />
                  <span>Hapus Respon</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailModalOpen(false)}
                    className="admin-btn-ghost text-xs px-4 py-2"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDetail}
                    disabled={savingDetail}
                    className="admin-btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                  >
                    <FontAwesomeIcon
                      icon={['fa-solid', savingDetail ? 'fa-spinner' : 'fa-check']}
                      className={savingDetail ? 'fa-spin' : ''}
                    />
                    <span>{savingDetail ? 'Menyimpan…' : 'Simpan Perubahan'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PHOTO PREVIEW LIGHTBOX */}
      <AnimatePresence>
        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewImage}
                alt="Preview Lampiran"
                className="max-w-full max-h-[80vh] object-contain mx-auto"
              />
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 bg-slate-900/80 text-white rounded-full p-2 hover:bg-slate-800 transition-colors"
                title="Tutup"
              >
                <FontAwesomeIcon icon={['fa-solid', 'fa-xmark']} className="text-base" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
