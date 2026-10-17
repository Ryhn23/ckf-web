import { useState, useEffect, useMemo } from 'react';
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
import { generateSubmissionPdf } from '../../utils/generateSubmissionPdf';
import { downloadQrCodeImage } from '../../utils/generateQrCode';

function isImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return (
    /\.(jpg|jpeg|png|webp|gif|svg|avif)($|\?)/i.test(url) ||
    url.startsWith('/uploads/') ||
    url.startsWith('data:image/')
  );
}

function getSubmissionImages(sub, fields = []) {
  if (!sub || !sub.data) return [];
  const images = [];

  // 1. Check all form fields of type image / file
  (fields || []).forEach((field) => {
    const isImageOrFile = field.type === 'image' || field.type === 'file';
    const val = sub.data[field.id];

    if (!val) return;

    if (Array.isArray(val)) {
      val.forEach((item, idx) => {
        if (typeof item === 'string' && (isImageOrFile || isImageUrl(item))) {
          images.push({
            url: item,
            label: field.label + (val.length > 1 ? ` (${idx + 1})` : ''),
            fieldName: field.label,
            fieldId: field.id,
          });
        }
      });
    } else if (typeof val === 'string') {
      if (isImageOrFile || isImageUrl(val)) {
        images.push({
          url: val,
          label: field.label,
          fieldName: field.label,
          fieldId: field.id,
        });
      }
    }
  });

  // 2. Fallback check any other field with image URL in sub.data not matched above
  Object.entries(sub.data).forEach(([key, val]) => {
    if (images.some((img) => img.fieldId === key)) return;
    if (typeof val === 'string' && isImageUrl(val)) {
      const matchedField = (fields || []).find((f) => f.id === key);
      images.push({
        url: val,
        label: matchedField?.label || key,
        fieldName: matchedField?.label || key,
        fieldId: key,
      });
    }
  });

  return images;
}

function getRespondentName(sub, fields = []) {
  if (!sub || !sub.data) return 'Responden';
  const nameField = (fields || []).find((f) => /nama/i.test(f.label)) || fields[0];
  if (nameField && sub.data[nameField.id]) {
    return String(sub.data[nameField.id]);
  }
  return `ID: ${sub.id}`;
}

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

  // Lightbox Modal State
  // { submission, respondentName, submissionId, items: [{ url, label, fieldName, fieldId }], index: number }
  const [lightbox, setLightbox] = useState(null);

  // PDF & QR Download state — tracks which submission is being downloaded
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);
  const [downloadingQrId, setDownloadingQrId] = useState(null);

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

  // Submissions on current page that have at least one image
  const respondentsWithImages = useMemo(() => {
    return submissions
      .map((s) => ({ sub: s, images: getSubmissionImages(s, fields) }))
      .filter((item) => item.images.length > 0);
  }, [submissions, fields]);

  // Open Lightbox for a specific submission and image index
  function handleOpenLightbox(sub, initialImgIndex = 0) {
    if (!sub) return;
    const items = getSubmissionImages(sub, fields);
    if (!items || items.length === 0) return;

    const safeIndex = Math.max(0, Math.min(initialImgIndex, items.length - 1));

    setLightbox({
      submission: sub,
      respondentName: getRespondentName(sub, fields),
      submissionId: sub.id,
      items,
      index: safeIndex,
    });
  }

  // Previous image of current respondent (or jump to previous respondent if 1 image)
  function handleLightboxPrev() {
    if (!lightbox || !lightbox.items || lightbox.items.length === 0) return;
    if (lightbox.items.length > 1) {
      setLightbox((prev) => ({
        ...prev,
        index: prev.index > 0 ? prev.index - 1 : prev.items.length - 1,
      }));
    } else {
      handleJumpRespondent(-1);
    }
  }

  // Next image of current respondent (or jump to next respondent if 1 image)
  function handleLightboxNext() {
    if (!lightbox || !lightbox.items || lightbox.items.length === 0) return;
    if (lightbox.items.length > 1) {
      setLightbox((prev) => ({
        ...prev,
        index: (prev.index + 1) % prev.items.length,
      }));
    } else {
      handleJumpRespondent(1);
    }
  }

  // Jump to next or previous respondent
  function handleJumpRespondent(direction) {
    if (!lightbox || respondentsWithImages.length <= 1) return;
    const currentIdx = respondentsWithImages.findIndex(
      (r) => r.sub.id === lightbox.submission?.id,
    );
    if (currentIdx === -1) return;

    let targetIdx = currentIdx + direction;
    if (targetIdx < 0) targetIdx = respondentsWithImages.length - 1;
    if (targetIdx >= respondentsWithImages.length) targetIdx = 0;

    const targetRespondent = respondentsWithImages[targetIdx];
    if (targetRespondent) {
      handleOpenLightbox(targetRespondent.sub, 0);
    }
  }

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightbox) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setLightbox(null);
      } else if (e.key === 'ArrowLeft') {
        handleLightboxPrev();
      } else if (e.key === 'ArrowRight') {
        handleLightboxNext();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [lightbox, respondentsWithImages]);

  // Handle PDF download for a single submission
  async function handleDownloadPdf(sub) {
    if (!sub || !form || downloadingPdfId) return;
    setDownloadingPdfId(sub.id);
    try {
      await generateSubmissionPdf(
        sub,
        fields,
        form.title || 'Formulir',
        form.id || '',
      );
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setDownloadingPdfId(null);
    }
  }

  // Handle QR code download for a single submission
  async function handleDownloadQr(sub) {
    if (!sub || downloadingQrId) return;
    setDownloadingQrId(sub.id);
    try {
      await downloadQrCodeImage(
        sub.id,
        `QR_${sub.id}.png`,
        sub.id
      );
    } catch (err) {
      console.error('QR download error:', err);
      alert('Gagal mengunduh QR Code: ' + (err.message || err));
    } finally {
      setDownloadingQrId(null);
    }
  }

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

                  // Collect all image uploads for this respondent
                  const subImages = getSubmissionImages(sub, fields);

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
                        {subImages.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleOpenLightbox(sub, 0)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs group"
                            title={
                              subImages.length > 1
                                ? `Lihat ${subImages.length} foto lampiran peserta ini`
                                : 'Lihat foto lampiran'
                            }
                          >
                            <FontAwesomeIcon
                              icon={['fa-solid', subImages.length > 1 ? 'fa-images' : 'fa-image']}
                              className="text-xs text-slate-500 group-hover:text-slate-800"
                            />
                            <span>
                              {subImages.length > 1 ? `Lihat Foto (${subImages.length})` : 'Lihat Foto'}
                            </span>
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
                            onClick={() => handleDownloadPdf(sub)}
                            disabled={downloadingPdfId === sub.id}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition shadow-2xs disabled:opacity-50"
                            title="Download PDF respon ini"
                          >
                            <FontAwesomeIcon
                              icon={['fa-solid', downloadingPdfId === sub.id ? 'fa-spinner' : 'fa-file-pdf']}
                              className={downloadingPdfId === sub.id ? 'fa-spin' : ''}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadQr(sub)}
                            disabled={downloadingQrId === sub.id}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition shadow-2xs disabled:opacity-50"
                            title="Download QR Code ID Pendaftaran"
                          >
                            <FontAwesomeIcon
                              icon={['fa-solid', downloadingQrId === sub.id ? 'fa-spinner' : 'fa-qrcode']}
                              className={downloadingQrId === sub.id ? 'fa-spin' : ''}
                            />
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
                                    onClick={() => {
                                      const allSubImages = getSubmissionImages(selectedSub, fields);
                                      const foundIdx = allSubImages.findIndex((img) => img.url === val);
                                      handleOpenLightbox(selectedSub, foundIdx >= 0 ? foundIdx : 0);
                                    }}
                                    className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-semibold shadow hover:bg-slate-100 transition"
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
                  {/* PDF Download button */}
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(selectedSub)}
                    disabled={downloadingPdfId === selectedSub.id}
                    className="admin-btn-secondary text-xs flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 hover:border-indigo-300 disabled:opacity-50"
                    title="Download PDF respon ini"
                  >
                    <FontAwesomeIcon
                      icon={['fa-solid', downloadingPdfId === selectedSub.id ? 'fa-spinner' : 'fa-file-pdf']}
                      className={downloadingPdfId === selectedSub.id ? 'fa-spin' : ''}
                    />
                    <span>{downloadingPdfId === selectedSub.id ? 'Membuat PDF…' : 'Download PDF'}</span>
                  </button>

                  {/* QR Download button */}
                  <button
                    type="button"
                    onClick={() => handleDownloadQr(selectedSub)}
                    disabled={downloadingQrId === selectedSub.id}
                    className="admin-btn-secondary text-xs flex items-center gap-1.5 text-emerald-600 hover:text-emerald-800 hover:border-emerald-300 disabled:opacity-50"
                    title="Download QR Code ID Pendaftaran"
                  >
                    <FontAwesomeIcon
                      icon={['fa-solid', downloadingQrId === selectedSub.id ? 'fa-spinner' : 'fa-qrcode']}
                      className={downloadingQrId === selectedSub.id ? 'fa-spin' : ''}
                    />
                    <span>{downloadingQrId === selectedSub.id ? 'Mengunduh QR…' : 'Download QR'}</span>
                  </button>

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

      {/* PHOTO PREVIEW LIGHTBOX GALLERY */}
      <AnimatePresence>
        {lightbox && lightbox.items && lightbox.items.length > 0 && (() => {
          const currentImg = lightbox.items[lightbox.index] || lightbox.items[0];
          const hasMultiplePhotos = lightbox.items.length > 1;
          const currentRespondentOrder = respondentsWithImages.findIndex(
            (r) => r.sub.id === lightbox.submission?.id,
          );
          const hasPrevRespondent = currentRespondentOrder > 0;
          const hasNextRespondent =
            currentRespondentOrder !== -1 &&
            currentRespondentOrder < respondentsWithImages.length - 1;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950/95 backdrop-blur-md p-3 sm:p-5 select-none"
              onClick={() => setLightbox(null)}
            >
              {/* Top Navigation Bar */}
              <div
                className="flex items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 text-white shadow-xl max-w-5xl w-full mx-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-white flex items-center justify-center text-xs shadow-xs flex-shrink-0">
                    <FontAwesomeIcon icon={['fa-solid', hasMultiplePhotos ? 'fa-images' : 'fa-image']} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                        {lightbox.respondentName}
                      </h4>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 hidden sm:inline">
                        ID: {lightbox.submissionId}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span className="text-slate-200 font-medium truncate max-w-[200px] sm:max-w-xs">{currentImg.label}</span>
                      {hasMultiplePhotos && (
                        <span>• Foto {lightbox.index + 1} dari {lightbox.items.length}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Center / Respondent Jump Controls (if multiple respondents have photos) */}
                {respondentsWithImages.length > 1 && (
                  <div className="hidden md:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2 py-1 text-xs">
                    <button
                      type="button"
                      disabled={!hasPrevRespondent}
                      onClick={() => handleJumpRespondent(-1)}
                      className="px-2 py-0.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition rounded"
                      title="Lihat foto responden sebelumnya"
                    >
                      <FontAwesomeIcon icon={['fa-solid', 'fa-chevron-left']} className="mr-1 text-[10px]" />
                      <span>Responden Sblm</span>
                    </button>
                    <span className="text-[10px] font-mono text-slate-400 px-1 border-x border-slate-700">
                      {currentRespondentOrder + 1} / {respondentsWithImages.length}
                    </span>
                    <button
                      type="button"
                      disabled={!hasNextRespondent}
                      onClick={() => handleJumpRespondent(1)}
                      className="px-2 py-0.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition rounded"
                      title="Lihat foto responden berikutnya"
                    >
                      <span>Responden Brkt</span>
                      <FontAwesomeIcon icon={['fa-solid', 'fa-chevron-right']} className="ml-1 text-[10px]" />
                    </button>
                  </div>
                )}

                {/* Right Action Icons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={currentImg.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700 text-xs shadow-xs"
                    title="Buka gambar di tab baru"
                  >
                    <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-up-right-from-square']} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setLightbox(null)}
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 text-xs shadow-xs"
                    title="Tutup (Esc)"
                  >
                    <FontAwesomeIcon icon={['fa-solid', 'fa-xmark']} />
                  </button>
                </div>
              </div>

              {/* Main Image Viewport with Floating Prev / Next Controls */}
              <div
                className="relative flex-1 flex items-center justify-center my-3 max-w-5xl w-full mx-auto overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Floating Prev Button */}
                {(hasMultiplePhotos || respondentsWithImages.length > 1) && (
                  <button
                    type="button"
                    onClick={handleLightboxPrev}
                    className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-slate-900/85 hover:bg-slate-800 text-white flex items-center justify-center transition-all border border-slate-700/80 shadow-2xl z-20 group hover:scale-105"
                    title="Foto Sebelumnya (Panah Kiri ←)"
                  >
                    <FontAwesomeIcon
                      icon={['fa-solid', 'fa-chevron-left']}
                      className="text-sm sm:text-base group-hover:-translate-x-0.5 transition-transform"
                    />
                  </button>
                )}

                {/* Active Image */}
                <motion.img
                  key={currentImg.url + lightbox.index}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  src={currentImg.url}
                  alt={currentImg.label}
                  className="max-h-[60vh] sm:max-h-[68vh] max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800 bg-black/60 select-none"
                />

                {/* Floating Next Button */}
                {(hasMultiplePhotos || respondentsWithImages.length > 1) && (
                  <button
                    type="button"
                    onClick={handleLightboxNext}
                    className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-slate-900/85 hover:bg-slate-800 text-white flex items-center justify-center transition-all border border-slate-700/80 shadow-2xl z-20 group hover:scale-105"
                    title="Foto Berikutnya (Panah Kanan →)"
                  >
                    <FontAwesomeIcon
                      icon={['fa-solid', 'fa-chevron-right']}
                      className="text-sm sm:text-base group-hover:translate-x-0.5 transition-transform"
                    />
                  </button>
                )}
              </div>

              {/* Bottom Thumbnail Strip & Controls */}
              <div
                className="max-w-5xl w-full mx-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {hasMultiplePhotos ? (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl flex flex-col items-center gap-2">
                    {/* Thumbnails Row */}
                    <div className="flex items-center gap-2 overflow-x-auto max-w-full py-0.5 px-1 scrollbar-thin">
                      {lightbox.items.map((item, idx) => (
                        <button
                          key={item.url + idx}
                          type="button"
                          onClick={() => setLightbox((prev) => ({ ...prev, index: idx }))}
                          className={`relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all ${
                            idx === lightbox.index
                              ? 'border-white ring-2 ring-white/50 scale-105 shadow-md'
                              : 'border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500'
                          }`}
                          title={item.label}
                        >
                          <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[9px] text-white font-mono truncate px-1 text-center">
                            #{idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 text-center">
                      <span className="font-semibold text-slate-200">{currentImg.label}</span> • Gunakan tombol panah <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">→</kbd> di keyboard untuk berpindah foto, <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">Esc</kbd> untuk menutup
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-1">
                    <p className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-200">{currentImg.label}</span> • Tekan <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">Esc</kbd> untuk menutup
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
