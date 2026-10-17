import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getRegistrationEventById,
  getEventAttendances,
  checkInAttendee,
  deleteEventAttendance,
  exportEventAttendance,
} from '../../api/registrations';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/formatDate';
import QrScannerModal from '../../components/admin/QrScannerModal';

export default function RegistrationEventDetailAdmin() {
  const { id: eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [stats, setStats] = useState({ total: 0, qrScanCount: 0, manualCount: 0 });
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [methodFilter, setMethodFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Export State
  const [exporting, setExporting] = useState(false);

  // Scanner Modal State
  const [scannerOpen, setScannerOpen] = useState(false);

  // Manual Check-in Modal State
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualMode, setManualMode] = useState('code'); // 'code' | 'form'
  const [inputCode, setInputCode] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [inputInstitution, setInputInstitution] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState('');
  const [manualSuccessMsg, setManualSuccessMsg] = useState('');

  // Fetch Event & Attendances
  async function fetchEventData() {
    try {
      const res = await getRegistrationEventById(eventId);
      setEvent(res.data);
    } catch (err) {
      setError(errMsg(err, 'Gagal memuat data acara'));
    }
  }

  async function fetchAttendances() {
    setLoading(true);
    try {
      const res = await getEventAttendances(eventId, {
        page,
        limit: 20,
        method: methodFilter || undefined,
        search: search.trim() || undefined,
      });
      setAttendances(res.data || []);
      setMeta(res.meta || { page: 1, limit: 20, total: 0, totalPages: 1 });
      if (res.stats) setStats(res.stats);
    } catch (err) {
      setError(errMsg(err, 'Gagal memuat daftar kehadiran'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  useEffect(() => {
    fetchAttendances();
  }, [eventId, page, methodFilter, search]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  // Handle QR scan checkin callback
  async function handleScannerScan(scannedCode) {
    const res = await checkInAttendee(eventId, {
      code: scannedCode,
      method: 'QR_SCAN',
    });
    // Refresh table in background
    fetchAttendances();
    fetchEventData();
    return res;
  }

  // Handle Manual checkin submit
  async function handleManualSubmit(e) {
    e.preventDefault();
    setManualSaving(true);
    setManualError('');
    setManualSuccessMsg('');

    try {
      let payload = {};
      if (manualMode === 'code') {
        if (!inputCode.trim()) {
          setManualError('Masukkan ID Pendaftaran atau kode responden');
          setManualSaving(false);
          return;
        }
        payload = {
          code: inputCode.trim(),
          method: 'MANUAL',
        };
      } else {
        if (!inputName.trim()) {
          setManualError('Nama peserta wajib diisi');
          setManualSaving(false);
          return;
        }
        payload = {
          name: inputName.trim(),
          phone: inputPhone.trim() || null,
          email: inputEmail.trim() || null,
          institution: inputInstitution.trim() || null,
          notes: inputNotes.trim() || null,
          method: 'MANUAL',
        };
      }

      const res = await checkInAttendee(eventId, payload);
      setManualSuccessMsg(res.message || 'Presensi berhasil dicatat!');

      // Reset fields
      setInputCode('');
      setInputName('');
      setInputPhone('');
      setInputEmail('');
      setInputInstitution('');
      setInputNotes('');

      // Refresh list
      fetchAttendances();
      fetchEventData();

      // Close modal after brief delay
      setTimeout(() => {
        setManualModalOpen(false);
        setManualSuccessMsg('');
      }, 1500);
    } catch (err) {
      setManualError(errMsg(err, 'Gagal memproses kehadiran manual'));
    } finally {
      setManualSaving(false);
    }
  }

  // Handle Delete Attendance
  async function handleDeleteAttendance(attId, attName) {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin membatalkan / menghapus data presensi untuk "${attName}"?`
    );
    if (!confirmed) return;

    try {
      await deleteEventAttendance(eventId, attId);
      fetchAttendances();
      fetchEventData();
    } catch (err) {
      alert(errMsg(err, 'Gagal menghapus data presensi'));
    }
  }

  // Handle Export to Excel
  async function handleExportExcel() {
    if (exporting || !event) return;
    setExporting(true);
    try {
      await exportEventAttendance(eventId);
    } catch (err) {
      console.error('Export error:', err);
      alert('Gagal mengekspor data kehadiran ke Excel: ' + (err.message || err));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/admin/registrations" className="hover:text-slate-800 transition-colors flex items-center gap-1">
              <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-left']} className="text-[10px]" />
              <span>Daftar Acara Registrasi</span>
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-700">{event?.title || 'Presensi Acara'}</span>
          </div>

          <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {event?.title || 'Presensi Acara'}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
            {event?.eventDate && (
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={['fa-solid', 'fa-calendar']} className="text-slate-400" />
                <span>{formatDate(event.eventDate)}</span>
              </span>
            )}
            {event?.location && (
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={['fa-solid', 'fa-location-dot']} className="text-slate-400" />
                <span>{event.location}</span>
              </span>
            )}
            {event?.linkedForm && (
              <span className="flex items-center gap-1 text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md font-medium text-xs">
                <FontAwesomeIcon icon={['fa-solid', 'fa-clipboard-list']} className="text-slate-400" />
                <span>Form: {event.linkedForm.title}</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: Scan, Manual, Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mobile-First Camera QR Scanner Button */}
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="admin-btn-primary text-xs flex items-center gap-2"
          >
            <FontAwesomeIcon icon={['fa-solid', 'fa-camera']} />
            <span>Scan QR Code (Kamera)</span>
          </button>

          {/* Manual Input Attendance Button */}
          <button
            type="button"
            onClick={() => {
              setManualError('');
              setManualSuccessMsg('');
              setManualModalOpen(true);
            }}
            className="admin-btn-secondary text-xs flex items-center gap-1.5"
          >
            <FontAwesomeIcon icon={['fa-solid', 'fa-user-plus']} />
            <span>Input Manual</span>
          </button>

          {/* Excel Export Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || attendances.length === 0}
            className="admin-btn-secondary text-xs flex items-center gap-1.5 disabled:opacity-50"
            title="Ekspor rekap kehadiran ke format file Excel (.xlsx)"
          >
            <FontAwesomeIcon
              icon={['fa-solid', exporting ? 'fa-spinner' : 'fa-file-excel']}
              className={exporting ? 'fa-spin' : ''}
            />
            <span>{exporting ? 'Mengekspor…' : 'Ekspor Excel'}</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => { setMethodFilter(''); setPage(1); }}
          className={`admin-card p-4 cursor-pointer transition-all ${
            methodFilter === '' ? 'ring-1 ring-slate-900 border-slate-900/40' : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-users']} className="text-xs" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
          </div>
          <p className="mt-2.5 font-heading text-xl font-bold text-slate-900 truncate">
            {stats.total}
          </p>
          <p className="text-[11px] text-slate-400">Total peserta hadir</p>
        </div>

        <div
          onClick={() => { setMethodFilter('QR_SCAN'); setPage(1); }}
          className={`admin-card p-4 cursor-pointer transition-all ${
            methodFilter === 'QR_SCAN' ? 'ring-1 ring-slate-900 border-slate-900/40' : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-qrcode']} className="text-xs" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scan QR</span>
          </div>
          <p className="mt-2.5 font-heading text-xl font-bold text-slate-900 truncate">
            {stats.qrScanCount}
          </p>
          <p className="text-[11px] text-slate-400">Presensi via Scan QR</p>
        </div>

        <div
          onClick={() => { setMethodFilter('MANUAL'); setPage(1); }}
          className={`admin-card p-4 cursor-pointer transition-all ${
            methodFilter === 'MANUAL' ? 'ring-1 ring-slate-900 border-slate-900/40' : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-pen']} className="text-xs" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manual</span>
          </div>
          <p className="mt-2.5 font-heading text-xl font-bold text-slate-900 truncate">
            {stats.manualCount}
          </p>
          <p className="text-[11px] text-slate-400">Presensi via Input Manual</p>
        </div>
      </div>

      {/* Filter Segmented Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex flex-wrap gap-2">
          {[
            ['', 'Semua'],
            ['QR_SCAN', 'Scan QR Code'],
            ['MANUAL', 'Input Manual'],
          ].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => { setMethodFilter(val); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                methodFilter === val
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama, ID, kontak…"
              className="admin-input pl-8 pr-4 py-1.5 w-full text-xs"
            />
            <FontAwesomeIcon
              icon={['fa-solid', 'fa-magnifying-glass']}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
            />
          </form>

          <button
            onClick={fetchAttendances}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
            title="Muat ulang"
          >
            <FontAwesomeIcon icon={['fa-solid', 'fa-arrows-rotate']} />
          </button>
        </div>
      </div>

      {/* Attendance Records Table */}
      {loading ? (
        <Spinner label="Memuat data presensi kehadiran…" />
      ) : error ? (
        <EmptyState icon="fa-triangle-exclamation" title="Gagal memuat kehadiran" description={error} />
      ) : attendances.length === 0 ? (
        <EmptyState
          icon="fa-users"
          title="Belum ada kehadiran tercatat"
          description="Gunakan tombol Scan QR Code untuk memindai kartu peserta atau gunakan Input Manual untuk mencatat presensi."
          actionLabel="Buka Scanner Kamera"
          onAction={() => setScannerOpen(true)}
        />
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead>
                <tr>
                  <th className="admin-th w-12 text-center">No</th>
                  <th className="admin-th whitespace-nowrap">Waktu Hadir</th>
                  <th className="admin-th whitespace-nowrap">ID Pendaftaran / Tiket</th>
                  <th className="admin-th">Nama Peserta</th>
                  <th className="admin-th">Kontak & Instansi</th>
                  <th className="admin-th text-center">Metode Presensi</th>
                  <th className="admin-th">Sumber / Catatan</th>
                  <th className="admin-th text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendances.map((att, index) => {
                  const rowNum = (meta.page - 1) * meta.limit + index + 1;
                  const sourceForm = att.submission?.form?.title;

                  return (
                    <tr key={att.id} className="transition hover:bg-slate-50/70">
                      <td className="admin-td text-center text-xs font-mono text-slate-400">
                        {rowNum}
                      </td>

                      <td className="admin-td whitespace-nowrap text-xs text-slate-800">
                        {formatDate(att.checkInTime)}
                      </td>

                      <td className="admin-td whitespace-nowrap">
                        <span
                          className="font-mono text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200/90 px-2 py-0.5 rounded-md tracking-wider inline-flex items-center gap-1 select-all cursor-copy"
                          title="Klik/seleksi untuk menyalin"
                        >
                          <FontAwesomeIcon icon={['fa-solid', 'fa-id-card']} className="text-[10px] text-slate-400" />
                          {att.registrationId}
                        </span>
                      </td>

                      <td className="admin-td font-semibold text-slate-900">
                        {att.name}
                      </td>

                      <td className="admin-td text-xs text-slate-600">
                        {att.phone && (
                          <div className="flex items-center gap-1 font-mono text-slate-700">
                            <FontAwesomeIcon icon={['fa-solid', 'fa-phone']} className="text-[10px] text-slate-400" />
                            <span>{att.phone}</span>
                          </div>
                        )}
                        {att.institution && (
                          <div className="text-[11px] text-slate-400 line-clamp-1">{att.institution}</div>
                        )}
                        {!att.phone && !att.institution && <span className="text-slate-400">-</span>}
                      </td>

                      <td className="admin-td text-center whitespace-nowrap">
                        {att.checkInMethod === 'QR_SCAN' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-900 text-white shadow-2xs">
                            <FontAwesomeIcon icon={['fa-solid', 'fa-qrcode']} className="text-[10px]" />
                            <span>Scan QR</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            <FontAwesomeIcon icon={['fa-solid', 'fa-pen']} className="text-[10px] text-slate-400" />
                            <span>Manual</span>
                          </span>
                        )}
                      </td>

                      <td className="admin-td text-xs text-slate-500 max-w-[220px]">
                        {sourceForm ? (
                          <div className="font-medium text-slate-700 line-clamp-1" title={sourceForm}>
                            {sourceForm}
                          </div>
                        ) : null}
                        {att.notes && (
                          <div className="text-[11px] text-slate-400 italic line-clamp-1" title={att.notes}>
                            {att.notes}
                          </div>
                        )}
                        {!sourceForm && !att.notes && <span className="text-slate-400">-</span>}
                      </td>

                      <td className="admin-td text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteAttendance(att.id, att.name)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition shadow-2xs"
                          title="Hapus data presensi ini"
                        >
                          <FontAwesomeIcon icon={['fa-solid', 'fa-trash']} />
                        </button>
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
                Halaman {meta.page} dari {meta.totalPages} ({meta.total} kehadiran)
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

      {/* QR Code Scanner Camera Modal (Mobile First) */}
      <QrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScannerScan}
        eventTitle={event?.title}
      />

      {/* Modal Input Presensi Manual */}
      <AnimatePresence>
        {manualModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                <h3 className="font-heading text-base font-bold text-slate-900">
                  Input Presensi Manual
                </h3>
                <button
                  onClick={() => setManualModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <FontAwesomeIcon icon={['fa-solid', 'fa-xmark']} />
                </button>
              </div>

              {/* Mode Selector Tab */}
              <div className="flex border-b border-slate-100 bg-slate-50/40 p-1.5 gap-1.5">
                <button
                  type="button"
                  onClick={() => setManualMode('code')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
                    manualMode === 'code'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Gunakan ID Pendaftaran
                </button>
                <button
                  type="button"
                  onClick={() => setManualMode('form')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
                    manualMode === 'form'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Isi Data Baru
                </button>
              </div>

              <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
                {manualError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                    {manualError}
                  </div>
                )}
                {manualSuccessMsg && (
                  <div className="p-3 bg-slate-100 border border-slate-200 text-slate-800 text-xs rounded-xl font-medium">
                    {manualSuccessMsg}
                  </div>
                )}

                {manualMode === 'code' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ID Pendaftaran Formulir / Tiket <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: CKF-SAFIR-A1B2C3D4"
                      className="admin-input text-xs w-full font-mono uppercase placeholder:font-sans"
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Sistem akan mencari ID ini di data formulir pendaftaran dan menyinkronkan data peserta secara otomatis ke acara.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Lengkap Peserta <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        placeholder="Nama peserta..."
                        className="admin-input text-xs w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          No. WhatsApp / HP
                        </label>
                        <input
                          type="text"
                          value={inputPhone}
                          onChange={(e) => setInputPhone(e.target.value)}
                          placeholder="08xxxxxxxxxx"
                          className="admin-input text-xs w-full font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Email (Opsional)
                        </label>
                        <input
                          type="email"
                          value={inputEmail}
                          onChange={(e) => setInputEmail(e.target.value)}
                          placeholder="peserta@email.com"
                          className="admin-input text-xs w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Asal Lembaga / Instansi / Domisili
                      </label>
                      <input
                        type="text"
                        value={inputInstitution}
                        onChange={(e) => setInputInstitution(e.target.value)}
                        placeholder="Contoh: SMP Negeri 1 / RT 04 RW 02"
                        className="admin-input text-xs w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Catatan Petugas (Opsional)
                      </label>
                      <input
                        type="text"
                        value={inputNotes}
                        onChange={(e) => setInputNotes(e.target.value)}
                        placeholder="Catatan tambahan..."
                        className="admin-input text-xs w-full"
                      />
                    </div>
                  </>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setManualModalOpen(false)}
                    className="admin-btn-ghost text-xs px-4 py-2"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={manualSaving}
                    className="admin-btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
                  >
                    {manualSaving && <FontAwesomeIcon icon={['fa-solid', 'fa-spinner']} className="fa-spin" />}
                    <span>Catat Kehadiran</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
