import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getCustomForms,
  createCustomForm,
  updateCustomForm,
  toggleCustomFormStatus,
  deleteCustomForm,
} from '../../api/customForms';
import { uploadMedia } from '../../api/media';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/formatDate';

const FIELD_TYPES = [
  { value: 'text', label: 'Teks Singkat', icon: 'fa-file-lines', desc: 'Nama, judul, dsb.' },
  { value: 'textarea', label: 'Teks Panjang / Paragraf', icon: 'fa-align-left', desc: 'Alamat, alasan, deskripsi.' },
  { value: 'number', label: 'Angka / Nominal', icon: 'fa-hashtag', desc: 'Jumlah, usia, nominal.' },
  { value: 'email', label: 'Alamat Email', icon: 'fa-envelope', desc: 'Format email valid.' },
  { value: 'phone', label: 'Nomor WhatsApp / HP', icon: 'fa-phone', desc: 'No telepon atau WhatsApp.' },
  { value: 'date', label: 'Tanggal', icon: 'fa-calendar', desc: 'Pemilih tanggal.' },
  { value: 'select', label: 'Pilihan Dropdown', icon: 'fa-list-check', desc: 'Satu pilihan dari daftar.' },
  { value: 'radio', label: 'Pilihan Tunggal (Radio)', icon: 'fa-circle-dot', desc: 'Pilih satu opsi terbuka.' },
  { value: 'checkbox', label: 'Pilihan Ganda (Checkbox)', icon: 'fa-square-check', desc: 'Dapat memilih lebih dari satu.' },
  { value: 'image', label: 'Upload Foto / Gambar', icon: 'fa-image', desc: 'Unggah berkas foto (WebP auto-compress).' },
];

function generateFieldId(index) {
  return `field_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`;
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CustomFormsAdmin() {
  const [forms, setForms] = useState([]);
  const [stats, setStats] = useState({ totalForms: 0, activeForms: 0, totalSubmissions: 0, submissionsToday: 0 });
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Builder Modal State
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderTab, setBuilderTab] = useState('general'); // 'general' | 'fields'
  const [editingFormId, setEditingFormId] = useState(null);
  const [builderSaving, setBuilderSaving] = useState(false);
  const [builderError, setBuilderError] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  // Form Model
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formSlugEdited, setFormSlugEdited] = useState(false);
  const [formDescription, setFormDescription] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formSuccessMessage, setFormSuccessMessage] = useState('Terima kasih, formulir Anda telah berhasil dikirim.');
  const [formFields, setFormFields] = useState([]);

  // Copy feedback
  const [copiedSlug, setCopiedSlug] = useState(null);
  const coverFileInputRef = useRef(null);

  // Fetch forms
  async function fetchForms() {
    setLoading(true);
    setError(null);
    try {
      const res = await getCustomForms({
        page,
        limit: 10,
        search: search.trim() || undefined,
        isActive: statusFilter || undefined,
      });
      setForms(res.data || []);
      setMeta(res.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
      if (res.stats) setStats(res.stats);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchForms();
  }, [page, statusFilter]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchForms();
  }

  // Open builder for creating new form
  function handleOpenCreate() {
    setEditingFormId(null);
    setFormTitle('');
    setFormSlug('');
    setFormSlugEdited(false);
    setFormDescription('');
    setFormCoverImage('');
    setFormIsActive(true);
    setFormSuccessMessage('Terima kasih, formulir Anda telah berhasil dikirim.');
    // Start with 2 default helpful fields
    setFormFields([
      {
        id: generateFieldId(1),
        label: 'Nama Lengkap',
        type: 'text',
        required: true,
        placeholder: 'Masukkan nama lengkap Anda',
        helpText: '',
        options: [],
      },
      {
        id: generateFieldId(2),
        label: 'Nomor WhatsApp',
        type: 'phone',
        required: true,
        placeholder: 'Contoh: 081234567890',
        helpText: 'Pastikan nomor aktif terhubung ke WhatsApp',
        options: [],
      },
    ]);
    setBuilderTab('general');
    setBuilderError('');
    setBuilderOpen(true);
  }

  // Open builder for editing
  function handleOpenEdit(form) {
    setEditingFormId(form.id);
    setFormTitle(form.title || '');
    setFormSlug(form.slug || '');
    setFormSlugEdited(true);
    setFormDescription(form.description || '');
    setFormCoverImage(form.coverImage || '');
    setFormIsActive(Boolean(form.isActive));
    setFormSuccessMessage(form.successMessage || 'Terima kasih, formulir Anda telah berhasil dikirim.');
    setFormFields(
      Array.isArray(form.fields) && form.fields.length > 0
        ? form.fields.map((f) => ({
            ...f,
            optionsText: Array.isArray(f.options) ? f.options.join(', ') : '',
          }))
        : [],
    );
    setBuilderTab('general');
    setBuilderError('');
    setBuilderOpen(true);
  }

  // Auto-slugify when title changes (unless user manually touched slug)
  function handleTitleChange(val) {
    setFormTitle(val);
    if (!formSlugEdited) {
      setFormSlug(slugify(val));
    }
  }

  // Add field to builder
  function handleAddField(type = 'text') {
    const defaultOpts = ['select', 'radio', 'checkbox'].includes(type) ? ['Pilihan 1', 'Pilihan 2'] : [];
    const newField = {
      id: generateFieldId(formFields.length + 1),
      label: `Pertanyaan Baru`,
      type,
      required: false,
      placeholder: '',
      helpText: '',
      options: defaultOpts,
      optionsText: defaultOpts.join(', '),
    };
    setFormFields([...formFields, newField]);
  }

  // Update specific field property
  function handleUpdateField(index, key, val) {
    const next = [...formFields];
    next[index] = { ...next[index], [key]: val };
    setFormFields(next);
  }

  // Remove field
  function handleRemoveField(index) {
    setFormFields(formFields.filter((_, i) => i !== index));
  }

  // Move field up/down
  function handleMoveField(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= formFields.length) return;
    const next = [...formFields];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    setFormFields(next);
  }

  // Cover image upload
  async function handleCoverUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const res = await uploadMedia(file);
      const url = res?.data?.url || res?.url;
      if (url) {
        setFormCoverImage(url);
      }
    } catch (err) {
      alert(errMsg(err, 'Gagal mengunggah banner gambar'));
    } finally {
      setUploadingCover(false);
    }
  }

  // Save form (create / update)
  async function handleSaveForm(e) {
    e?.preventDefault();
    if (!formTitle.trim()) {
      setBuilderError('Judul formulir wajib diisi');
      setBuilderTab('general');
      return;
    }

    if (formFields.length === 0) {
      setBuilderError('Minimal harus ada 1 field pertanyaan pada formulir');
      setBuilderTab('fields');
      return;
    }

    // Validate fields have labels
    for (let i = 0; i < formFields.length; i++) {
      if (!formFields[i].label.trim()) {
        setBuilderError(`Pertanyaan ke-${i + 1} belum memiliki judul/label`);
        setBuilderTab('fields');
        return;
      }
    }

    setBuilderSaving(true);
    setBuilderError('');

    try {
      const payload = {
        title: formTitle.trim(),
        slug: formSlug.trim() || slugify(formTitle),
        description: formDescription.trim() || null,
        coverImage: formCoverImage.trim() || null,
        isActive: formIsActive,
        successMessage: formSuccessMessage.trim() || 'Terima kasih, formulir Anda telah berhasil dikirim.',
        fields: formFields,
      };

      if (editingFormId) {
        await updateCustomForm(editingFormId, payload);
      } else {
        await createCustomForm(payload);
      }

      setBuilderOpen(false);
      fetchForms();
    } catch (err) {
      setBuilderError(errMsg(err, 'Gagal menyimpan formulir'));
    } finally {
      setBuilderSaving(false);
    }
  }

  // Toggle active status
  async function handleToggleStatus(form) {
    try {
      await toggleCustomFormStatus(form.id);
      setForms((prev) =>
        prev.map((f) => (f.id === form.id ? { ...f, isActive: !f.isActive } : f)),
      );
    } catch (err) {
      alert(errMsg(err, 'Gagal mengubah status formulir'));
    }
  }

  // Delete form
  async function handleDeleteForm(form) {
    const conf = window.confirm(
      `Apakah Anda yakin ingin menghapus formulir "${form.title}"?\nSemua data respon yang sudah masuk juga akan ikut terhapus permanen!`,
    );
    if (!conf) return;

    try {
      await deleteCustomForm(form.id);
      fetchForms();
    } catch (err) {
      alert(errMsg(err, 'Gagal menghapus formulir'));
    }
  }

  // Copy shareable link
  function handleCopyLink(slug) {
    const url = `${window.location.origin}/form/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
            Formulir Kustom
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Rancang formulir dinamis dengan field kustom, upload berkas, link publik, dan ekspor Excel.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="admin-btn-primary flex items-center gap-2"
        >
          <FontAwesomeIcon icon={['fa-solid', 'fa-plus']} />
          <span>Buat Formulir Baru</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => { setStatusFilter(''); setPage(1); }}
          className="admin-card p-4 cursor-pointer transition-all hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-clipboard-list']} className="text-xs" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
          </div>
          <p className="mt-2.5 font-heading text-xl font-bold text-slate-900 truncate">
            {stats.totalForms}
          </p>
          <p className="text-[11px] text-slate-400">Total formulir dibuat</p>
        </div>

        <div
          onClick={() => { setStatusFilter('true'); setPage(1); }}
          className="admin-card p-4 cursor-pointer transition-all hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-circle-check']} className="text-xs" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aktif</span>
          </div>
          <p className="mt-2.5 font-heading text-xl font-bold text-slate-900 truncate">
            {stats.activeForms}
          </p>
          <p className="text-[11px] text-slate-400">Menerima respon publik</p>
        </div>

        <div className="admin-card p-4 transition-all hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-inbox']} className="text-xs" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Respon</span>
          </div>
          <p className="mt-2.5 font-heading text-xl font-bold text-slate-900 truncate">
            {stats.totalSubmissions}
          </p>
          <p className="text-[11px] text-slate-400">Total respon tersimpan</p>
        </div>

        <div className="admin-card p-4 transition-all hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
              <FontAwesomeIcon icon={['fa-solid', 'fa-calendar-check']} className="text-xs" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hari Ini</span>
          </div>
          <p className="mt-2.5 font-heading text-xl font-bold text-slate-900 truncate">
            {stats.submissionsToday}
          </p>
          <p className="text-[11px] text-slate-400">Respon masuk hari ini</p>
        </div>
      </div>

      {/* Filter Segmented Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex flex-wrap gap-2">
          {[
            ['', 'Semua Status'],
            ['true', 'Aktif'],
            ['false', 'Nonaktif'],
          ].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => { setStatusFilter(val); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === val
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari formulir…"
              className="admin-input pl-8 pr-4 py-1.5 w-full text-xs"
            />
            <FontAwesomeIcon
              icon={['fa-solid', 'fa-magnifying-glass']}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
            />
          </form>

          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); fetchForms(); }}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
            title="Muat ulang"
          >
            <FontAwesomeIcon icon={['fa-solid', 'fa-arrows-rotate']} />
          </button>
        </div>
      </div>

      {/* Forms Table */}
      {loading ? (
        <Spinner label="Memuat daftar formulir kustom…" />
      ) : error ? (
        <EmptyState
          icon="fa-triangle-exclamation"
          title="Gagal memuat formulir"
          description={error}
        />
      ) : forms.length === 0 ? (
        <EmptyState
          icon="fa-clipboard-list"
          title="Belum ada formulir kustom"
          description="Buat formulir kustom pertama Anda untuk pendaftaran event, survei, atau pendataan relawan."
          actionLabel="Buat Formulir Baru"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead>
                <tr>
                  <th className="admin-th">Formulir & Link Khusus</th>
                  <th className="admin-th text-center">Jumlah Field</th>
                  <th className="admin-th text-center">Respon Masuk</th>
                  <th className="admin-th text-center">Status</th>
                  <th className="admin-th text-right">Tanggal Buat</th>
                  <th className="admin-th text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forms.map((form) => {
                  const fieldCount = Array.isArray(form.fields) ? form.fields.length : 0;
                  const submissionCount = form._count?.submissions ?? 0;
                  const shareUrl = `/form/${form.slug}`;

                  return (
                    <tr key={form.id} className="transition hover:bg-slate-50/70">
                      <td className="admin-td max-w-sm">
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {form.title}
                        </div>
                        {form.description && (
                          <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            {form.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200/70">
                            <FontAwesomeIcon icon={['fa-solid', 'fa-link']} className="text-[10px] text-slate-400" />
                            {shareUrl}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(form.slug)}
                            className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
                            title="Salin Link Shareable"
                          >
                            {copiedSlug === form.slug ? (
                              <span className="text-slate-900 font-semibold flex items-center gap-1">
                                <FontAwesomeIcon icon={['fa-solid', 'fa-check']} className="text-[10px]" />
                                Tersalin!
                              </span>
                            ) : (
                              <FontAwesomeIcon icon={['fa-solid', 'fa-copy']} className="text-xs" />
                            )}
                          </button>
                          <a
                            href={shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-slate-400 hover:text-slate-700"
                            title="Buka Formulir Publik"
                          >
                            <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-up-right-from-square']} className="text-xs" />
                          </a>
                        </div>
                      </td>

                      <td className="admin-td text-center">
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {fieldCount} Field
                        </span>
                      </td>

                      <td className="admin-td text-center">
                        <Link
                          to={`/admin/custom-forms/${form.id}/submissions`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                        >
                          <FontAwesomeIcon icon={['fa-solid', 'fa-inbox']} className="text-slate-400 text-xs" />
                          <span>{submissionCount} Respon</span>
                        </Link>
                      </td>

                      <td className="admin-td text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(form)}
                          title={form.isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                          className="cursor-pointer"
                        >
                          <StatusBadge status={form.isActive ? 'AKTIF' : 'NONAKTIF'} />
                        </button>
                      </td>

                      <td className="admin-td text-right whitespace-nowrap text-xs text-slate-500">
                        {formatDate(form.createdAt)}
                      </td>

                      <td className="admin-td">
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/admin/custom-forms/${form.id}/submissions`}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                            title="Respon Masuk"
                          >
                            <FontAwesomeIcon icon={['fa-solid', 'fa-inbox']} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(form)}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                            title="Edit Formulir"
                          >
                            <FontAwesomeIcon icon={['fa-solid', 'fa-pen']} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteForm(form)}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition shadow-2xs"
                            title="Hapus Formulir"
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
                Halaman {meta.page} dari {meta.totalPages} ({meta.total} formulir)
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

      {/* FORM BUILDER MODAL */}
      <AnimatePresence>
        {builderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
                <div>
                  <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FontAwesomeIcon icon={['fa-solid', 'fa-clipboard-list']} className="text-slate-600" />
                    <span>{editingFormId ? 'Edit Formulir Kustom' : 'Buat Formulir Kustom Baru'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Konfigurasikan rincian umum dan buat pertanyaan field dinamis yang diinginkan.
                  </p>
                </div>
                <button
                  onClick={() => setBuilderOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
                >
                  <FontAwesomeIcon icon={['fa-solid', 'fa-xmark']} className="text-base" />
                </button>
              </div>

              {/* Builder Tabs */}
              <div className="flex border-b border-slate-200 px-6 bg-white">
                <button
                  onClick={() => setBuilderTab('general')}
                  className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                    builderTab === 'general'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <FontAwesomeIcon icon={['fa-solid', 'fa-gear']} />
                  <span>1. Informasi Umum</span>
                </button>
                <button
                  onClick={() => setBuilderTab('fields')}
                  className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                    builderTab === 'fields'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <FontAwesomeIcon icon={['fa-solid', 'fa-list-check']} />
                  <span>2. Rancang Field / Pertanyaan ({formFields.length})</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {builderError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} />
                    <span>{builderError}</span>
                  </div>
                )}

                {/* TAB 1: INFORMASI UMUM */}
                {builderTab === 'general' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Judul Formulir <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Contoh: Pendaftaran Relawan Ramadhan 1448 H"
                        className="admin-input w-full"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Link Kustom / Slug (URL Publik)
                        </label>
                        <div className="flex items-center">
                          <span className="bg-slate-100 text-slate-500 border border-r-0 border-slate-300 rounded-l-lg px-2.5 py-2 text-xs font-mono">
                            /form/
                          </span>
                          <input
                            type="text"
                            value={formSlug}
                            onChange={(e) => {
                              setFormSlug(slugify(e.target.value));
                              setFormSlugEdited(true);
                            }}
                            placeholder="pendaftaran-relawan"
                            className="admin-input rounded-l-none w-full font-mono text-xs"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Alamat akses langsung: <code className="text-slate-600 font-mono">cintakasihfatimah.com/form/{formSlug || 'slug'}</code>
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Status Penerimaan
                        </label>
                        <select
                          value={formIsActive ? 'active' : 'inactive'}
                          onChange={(e) => setFormIsActive(e.target.value === 'active')}
                          className="admin-select w-full"
                        >
                          <option value="active">Buka Penerimaan (Aktif)</option>
                          <option value="inactive">Tutup Penerimaan (Nonaktif)</option>
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Jika ditutup, publik tidak dapat mengisi formulir ini lagi.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Deskripsi / Petunjuk Pengisian
                      </label>
                      <textarea
                        rows={3}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Tuliskan petunjuk singkat atau syarat bagi calon responden yang mengisi formulir ini…"
                        className="admin-input w-full text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Banner Gambar / Cover (Opsional)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={formCoverImage}
                          onChange={(e) => setFormCoverImage(e.target.value)}
                          placeholder="URL gambar atau upload banner..."
                          className="admin-input flex-1 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => coverFileInputRef.current?.click()}
                          disabled={uploadingCover}
                          className="admin-btn-secondary text-xs flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <FontAwesomeIcon icon={['fa-solid', 'fa-cloud-arrow-up']} />
                          <span>{uploadingCover ? 'Mengunggah…' : 'Unggah Banner'}</span>
                        </button>
                        <input
                          ref={coverFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          className="hidden"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Format banner landscape rasio baku 2:1 (rekomendasi: 1200×600 px).
                      </p>
                      {formCoverImage && (
                        <div
                          className="mt-2.5 relative w-full max-w-sm aspect-[2/1] rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                          style={{ aspectRatio: '2 / 1' }}
                        >
                          <img
                            src={formCoverImage}
                            alt="Cover Preview"
                            className="w-full h-full object-cover object-center"
                          />
                          <button
                            type="button"
                            onClick={() => setFormCoverImage('')}
                            className="absolute top-2 right-2 bg-slate-900/70 text-white rounded-full p-1.5 text-xs hover:bg-slate-900 transition-colors shadow"
                            title="Hapus banner"
                          >
                            <FontAwesomeIcon icon={['fa-solid', 'fa-xmark']} />
                          </button>
                          <span className="absolute bottom-2 left-2 bg-slate-900/70 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-xs">
                            Rasio 2:1
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Pesan Sukses Setelah Pengiriman
                      </label>
                      <input
                        type="text"
                        value={formSuccessMessage}
                        onChange={(e) => setFormSuccessMessage(e.target.value)}
                        placeholder="Terima kasih, formulir Anda telah berhasil dikirim."
                        className="admin-input w-full text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: RANCANG FIELD / PERTANYAAN */}
                {builderTab === 'fields' && (
                  <div className="space-y-4">
                    {/* Add Field Bar */}
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <p className="text-xs font-semibold text-slate-700 mb-2">
                        Pilih Tipe Field untuk Ditambahkan:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {FIELD_TYPES.map((t) => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => handleAddField(t.value)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200/90 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-sm"
                            title={t.desc}
                          >
                            <FontAwesomeIcon icon={['fa-solid', t.icon]} className="text-[11px] text-slate-500" />
                            <span>+ {t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Field List */}
                    {formFields.length === 0 ? (
                      <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                        <FontAwesomeIcon icon={['fa-solid', 'fa-list-check']} className="text-2xl text-slate-300 mb-2" />
                        <p className="text-xs font-medium text-slate-600">Belum ada field pertanyaan</p>
                        <p className="text-[11px] text-slate-400">Pilih salah satu tipe field di atas untuk mulai merancang.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formFields.map((field, idx) => {
                          const typeObj = FIELD_TYPES.find((t) => t.value === field.type) || {
                            label: field.type,
                            icon: 'fa-file-lines',
                          };
                          const hasOptions = ['select', 'radio', 'checkbox'].includes(field.type);

                          return (
                            <div
                              key={field.id}
                              className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-all space-y-3"
                            >
                              {/* Field Card Header */}
                              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="h-6 w-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold font-mono">
                                    {idx + 1}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                                    <FontAwesomeIcon icon={['fa-solid', typeObj.icon]} className="text-[10px]" />
                                    {typeObj.label}
                                  </span>
                                  {field.type === 'image' && (
                                    <span className="text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded">
                                      Auto-WebP
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveField(idx, -1)}
                                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                    title="Pindahkan ke atas"
                                  >
                                    <FontAwesomeIcon icon={['fa-solid', 'fa-chevron-left']} className="rotate-90 text-xs" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === formFields.length - 1}
                                    onClick={() => handleMoveField(idx, 1)}
                                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                    title="Pindahkan ke bawah"
                                  >
                                    <FontAwesomeIcon icon={['fa-solid', 'fa-chevron-right']} className="rotate-90 text-xs" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveField(idx)}
                                    className="p-1 text-rose-500 hover:text-rose-700 ml-1"
                                    title="Hapus field ini"
                                  >
                                    <FontAwesomeIcon icon={['fa-solid', 'fa-trash']} className="text-xs" />
                                  </button>
                                </div>
                              </div>

                              {/* Field Main Inputs */}
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                <div className="sm:col-span-6">
                                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    Label Pertanyaan <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={field.label}
                                    onChange={(e) => handleUpdateField(idx, 'label', e.target.value)}
                                    placeholder="Contoh: Nama Lengkap / Unggah KTP"
                                    className="admin-input w-full text-xs font-medium"
                                  />
                                </div>

                                <div className="sm:col-span-3">
                                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    Tipe Field
                                  </label>
                                  <select
                                    value={field.type}
                                    onChange={(e) => handleUpdateField(idx, 'type', e.target.value)}
                                    className="admin-select w-full text-xs"
                                  >
                                    {FIELD_TYPES.map((t) => (
                                      <option key={t.value} value={t.value}>
                                        {t.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="sm:col-span-3 flex items-end pb-2">
                                  <label className="inline-flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(field.required)}
                                      onChange={(e) => handleUpdateField(idx, 'required', e.target.checked)}
                                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                    />
                                    <span className="text-xs font-semibold text-slate-700">Wajib Diisi</span>
                                  </label>
                                </div>
                              </div>

                              {/* Placeholder & HelpText */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                    Placeholder (Teks Petunjuk di Kolom)
                                  </label>
                                  <input
                                    type="text"
                                    value={field.placeholder || ''}
                                    onChange={(e) => handleUpdateField(idx, 'placeholder', e.target.value)}
                                    placeholder="Contoh: Masukkan domisili Anda..."
                                    className="admin-input w-full text-xs text-slate-600"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                    Help Text (Keterangan Kecil di Bawah Kolom)
                                  </label>
                                  <input
                                    type="text"
                                    value={field.helpText || ''}
                                    onChange={(e) => handleUpdateField(idx, 'helpText', e.target.value)}
                                    placeholder="Contoh: Maksimal berkas 5MB dengan format JPG/PNG."
                                    className="admin-input w-full text-xs text-slate-600"
                                  />
                                </div>
                              </div>

                              {/* Options for select / radio / checkbox */}
                              {hasOptions && (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Opsi Pilihan (Pisahkan dengan tanda koma)
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      field.optionsText !== undefined
                                        ? field.optionsText
                                        : Array.isArray(field.options)
                                        ? field.options.join(', ')
                                        : ''
                                    }
                                    onChange={(e) => {
                                      const txt = e.target.value;
                                      const parsed = txt
                                        .split(',')
                                        .map((s) => s.trim())
                                        .filter(Boolean);
                                      const next = [...formFields];
                                      next[idx] = { ...next[idx], optionsText: txt, options: parsed };
                                      setFormFields(next);
                                    }}
                                    placeholder="Contoh: Logistik, Medis, Media"
                                    className="admin-input w-full text-xs font-mono"
                                  />
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {(Array.isArray(field.options) ? field.options : []).map((opt, oIdx) => (
                                      <span
                                        key={oIdx}
                                        className="text-[10px] font-medium bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                                      >
                                        {opt}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/80">
                <div className="text-xs text-slate-500">
                  {builderTab === 'general' ? (
                    <span>Lanjutkan ke tab pertanyaan untuk menambah field</span>
                  ) : (
                    <span>{formFields.length} field pertanyaan terdaftar</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBuilderOpen(false)}
                    className="admin-btn-ghost text-xs px-4 py-2"
                  >
                    Batal
                  </button>
                  {builderTab === 'general' ? (
                    <button
                      type="button"
                      onClick={() => setBuilderTab('fields')}
                      className="admin-btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                    >
                      <span>Lanjut: Atur Pertanyaan</span>
                      <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-right']} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveForm}
                      disabled={builderSaving}
                      className="admin-btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
                    >
                      <FontAwesomeIcon icon={['fa-solid', builderSaving ? 'fa-spinner' : 'fa-check']} className={builderSaving ? 'fa-spin' : ''} />
                      <span>{builderSaving ? 'Menyimpan…' : 'Simpan Formulir'}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
