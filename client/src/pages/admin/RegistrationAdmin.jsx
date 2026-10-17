import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getRegistrationEvents,
  createRegistrationEvent,
  updateRegistrationEvent,
  deleteRegistrationEvent,
} from '../../api/registrations';
import { getCustomForms } from '../../api/customForms';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/formatDate';

export default function RegistrationAdmin() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, activeEvents: 0, totalAttendances: 0, attendancesToday: 0 });
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Available custom forms for dropdown
  const [availableForms, setAvailableForms] = useState([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form Model
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [linkedFormId, setLinkedFormId] = useState('');
  const [eventIsActive, setEventIsActive] = useState(true);

  // Fetch events list
  async function fetchEvents() {
    setLoading(true);
    setError(null);
    try {
      const res = await getRegistrationEvents({
        page,
        limit: 10,
        search: search.trim() || undefined,
        isActive: statusFilter || undefined,
      });
      setEvents(res.data || []);
      setMeta(res.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
      if (res.stats) setStats(res.stats);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }

  // Fetch available forms for dropdown
  async function loadAvailableForms() {
    try {
      const res = await getCustomForms({ limit: 100 });
      setAvailableForms(res.data || []);
    } catch (err) {
      console.warn('Could not load custom forms list for dropdown:', err);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, [page, statusFilter]);

  useEffect(() => {
    loadAvailableForms();
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  }

  // Open Create Modal
  function handleOpenCreate() {
    setEditingEventId(null);
    setEventTitle('');
    setEventDescription('');
    setEventDate('');
    setEventLocation('');
    setLinkedFormId('');
    setEventIsActive(true);
    setModalError('');
    setModalOpen(true);
  }

  // Open Edit Modal
  function handleOpenEdit(ev) {
    setEditingEventId(ev.id);
    setEventTitle(ev.title || '');
    setEventDescription(ev.description || '');
    // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
    let formattedDateInput = '';
    if (ev.eventDate) {
      const d = new Date(ev.eventDate);
      formattedDateInput = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    }
    setEventDate(formattedDateInput);
    setEventLocation(ev.location || '');
    setLinkedFormId(ev.linkedFormId || '');
    setEventIsActive(ev.isActive ?? true);
    setModalError('');
    setModalOpen(true);
  }

  // Save Event (Create or Update)
  async function handleSaveEvent(e) {
    e.preventDefault();
    if (!eventTitle.trim()) {
      setModalError('Nama acara wajib diisi.');
      return;
    }

    setSaving(true);
    setModalError('');
    try {
      const payload = {
        title: eventTitle.trim(),
        description: eventDescription.trim() || null,
        eventDate: eventDate ? new Date(eventDate).toISOString() : null,
        location: eventLocation.trim() || null,
        linkedFormId: linkedFormId || null,
        isActive: eventIsActive,
      };

      if (editingEventId) {
        await updateRegistrationEvent(editingEventId, payload);
      } else {
        await createRegistrationEvent(payload);
      }

      setModalOpen(false);
      fetchEvents();
    } catch (err) {
      setModalError(errMsg(err, 'Gagal menyimpan acara'));
    } finally {
      setSaving(false);
    }
  }

  // Delete Event
  async function handleDeleteEvent(id, title) {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus acara "${title}" beserta seluruh data kehadirannya?`
    );
    if (!confirmed) return;

    try {
      await deleteRegistrationEvent(id);
      fetchEvents();
    } catch (err) {
      alert(errMsg(err, 'Gagal menghapus acara'));
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/admin" className="hover:text-slate-800 transition-colors">
              Admin
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-700">Registrasi Acara</span>
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Registrasi & Presensi Acara
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola acara, scan QR Code kehadiran peserta dari formulir kustom, dan ekspor kehadiran ke Excel.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="admin-btn-primary flex items-center gap-2 text-xs px-4 py-2.5 shadow-sm"
        >
          <FontAwesomeIcon icon={['fa-solid', 'fa-plus']} />
          <span>Buat Acara Baru</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="admin-card p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm shadow-xs">
            <FontAwesomeIcon icon={['fa-solid', 'fa-calendar-check']} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Acara</div>
            <div className="text-lg font-bold text-slate-900 font-mono">{stats.totalEvents}</div>
          </div>
        </div>

        <div className="admin-card p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm shadow-xs">
            <FontAwesomeIcon icon={['fa-solid', 'fa-circle-check']} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Acara Aktif</div>
            <div className="text-lg font-bold text-emerald-600 font-mono">{stats.activeEvents}</div>
          </div>
        </div>

        <div className="admin-card p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm shadow-xs">
            <FontAwesomeIcon icon={['fa-solid', 'fa-users']} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Kehadiran</div>
            <div className="text-lg font-bold text-indigo-600 font-mono">{stats.totalAttendances}</div>
          </div>
        </div>

        <div className="admin-card p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm shadow-xs">
            <FontAwesomeIcon icon={['fa-solid', 'fa-clock']} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Hadir Hari Ini</div>
            <div className="text-lg font-bold text-amber-600 font-mono">{stats.attendancesToday}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 p-3 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Status Acara:</span>
          <div className="flex items-center gap-1.5">
            {[
              { label: 'Semua', val: '' },
              { label: 'Aktif', val: 'true' },
              { label: 'Nonaktif', val: 'false' },
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama acara / lokasi..."
              className="admin-input py-1.5 pl-8 pr-7 text-xs w-full placeholder:font-sans"
            />
            <FontAwesomeIcon
              icon={['fa-solid', 'fa-magnifying-glass']}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1); fetchEvents(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 text-xs"
              >
                <FontAwesomeIcon icon={['fa-solid', 'fa-xmark']} />
              </button>
            )}
          </form>

          <button
            onClick={fetchEvents}
            className="admin-btn-ghost px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
            title="Muat ulang"
          >
            <FontAwesomeIcon icon={['fa-solid', 'fa-arrows-rotate']} className="mr-1" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Events List / Table */}
      {loading ? (
        <Spinner label="Memuat data acara registrasi…" />
      ) : error ? (
        <EmptyState icon="fa-triangle-exclamation" title="Gagal memuat acara" description={error} />
      ) : events.length === 0 ? (
        <EmptyState
          icon="fa-calendar-check"
          title="Belum ada acara registrasi"
          description="Buat acara baru untuk mulai mendata dan memindai kehadiran peserta menggunakan QR Code."
          action={
            <button onClick={handleOpenCreate} className="admin-btn-primary text-xs px-4 py-2">
              <FontAwesomeIcon icon={['fa-solid', 'fa-plus']} className="mr-1.5" />
              <span>Buat Acara Pertama</span>
            </button>
          }
        />
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="admin-th w-12 text-center">No</th>
                  <th className="admin-th">Nama Acara & Jadwal</th>
                  <th className="admin-th">Tautan Formulir Kustom</th>
                  <th className="admin-th text-center">Total Presensi</th>
                  <th className="admin-th text-center">Status</th>
                  <th className="admin-th text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {events.map((ev, index) => {
                  const rowNum = (meta.page - 1) * meta.limit + index + 1;
                  const attendanceCount = ev._count?.attendances || 0;

                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="admin-td text-center text-xs font-mono text-slate-400">
                        {rowNum}
                      </td>

                      <td className="admin-td">
                        <div className="font-semibold text-slate-900 line-clamp-1">{ev.title}</div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          {ev.eventDate && (
                            <span className="flex items-center gap-1">
                              <FontAwesomeIcon icon={['fa-solid', 'fa-calendar']} className="text-[11px] text-slate-400" />
                              <span>{formatDate(ev.eventDate)}</span>
                            </span>
                          )}
                          {ev.location && (
                            <span className="flex items-center gap-1">
                              <FontAwesomeIcon icon={['fa-solid', 'fa-location-dot']} className="text-[11px] text-slate-400" />
                              <span>{ev.location}</span>
                            </span>
                          )}
                        </div>
                        {ev.description && (
                          <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{ev.description}</div>
                        )}
                      </td>

                      <td className="admin-td">
                        {ev.linkedForm ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium">
                            <FontAwesomeIcon icon={['fa-solid', 'fa-clipboard-list']} className="text-[11px]" />
                            <span className="max-w-[200px] truncate">{ev.linkedForm.title}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Terbuka / Semua Formulir</span>
                        )}
                      </td>

                      <td className="admin-td text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono font-bold">
                          <FontAwesomeIcon icon={['fa-solid', 'fa-users']} className="text-[11px] text-slate-500" />
                          <span>{attendanceCount} Hadir</span>
                        </div>
                      </td>

                      <td className="admin-td text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            ev.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${ev.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                          />
                          {ev.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      <td className="admin-td text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Manage Attendance / Scanner Button */}
                          <Link
                            to={`/admin/registrations/${ev.id}`}
                            className="admin-btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 shadow-2xs"
                            title="Buka Scanner QR & Kelola Presensi"
                          >
                            <FontAwesomeIcon icon={['fa-solid', 'fa-qrcode']} />
                            <span>Presensi</span>
                          </Link>

                          {/* Edit Event Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(ev)}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                            title="Edit Data Acara"
                          >
                            <FontAwesomeIcon icon={['fa-solid', 'fa-pen']} />
                          </button>

                          {/* Delete Event Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev.id, ev.title)}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition shadow-2xs"
                            title="Hapus Acara"
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
                Halaman {meta.page} dari {meta.totalPages} ({meta.total} acara)
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

      {/* Modal Tambah / Edit Acara */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                <h3 className="font-heading text-base font-bold text-slate-900">
                  {editingEventId ? 'Edit Acara Registrasi' : 'Buat Acara Registrasi Baru'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <FontAwesomeIcon icon={['fa-solid', 'fa-xmark']} />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
                {modalError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                    {modalError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama / Judul Acara <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Contoh: Khitanan Massal Akbar 2026 / Santunan Anak Yatim"
                    className="admin-input text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deskripsi Singkat (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Keterangan singkat mengenai agenda atau pelaksanaan acara..."
                    className="admin-input text-xs w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Waktu & Tanggal Pelaksanaan
                    </label>
                    <input
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="admin-input text-xs w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Lokasi / Tempat Acara
                    </label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Contoh: Gedung Aula Fatimah"
                      className="admin-input text-xs w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tautkan ke Formulir Kustom (Opsional)
                  </label>
                  <select
                    value={linkedFormId}
                    onChange={(e) => setLinkedFormId(e.target.value)}
                    className="admin-input text-xs w-full bg-white"
                  >
                    <option value="">-- Terbuka (Bisa scan dari formulir manapun) --</option>
                    {availableForms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.title} ({f.formCode ? `Prefix: ${f.formCode}` : 'Standar'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Jika ditautkan, saat panitia melakukan scan QR Code, data responden dari formulir ini akan otomatis terhubung ke acara.
                  </p>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={eventIsActive}
                      onChange={(e) => setEventIsActive(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Acara aktif untuk presensi
                    </span>
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="admin-btn-ghost text-xs px-4 py-2"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="admin-btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
                  >
                    {saving && <FontAwesomeIcon icon={['fa-solid', 'fa-spinner']} className="fa-spin" />}
                    <span>{editingEventId ? 'Simpan Perubahan' : 'Buat Acara'}</span>
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
