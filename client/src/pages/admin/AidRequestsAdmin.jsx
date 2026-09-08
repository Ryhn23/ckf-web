import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import {
  getAidRequests,
  updateAidRequestStatus,
  deleteAidRequest,
  getAidCampaigns,
  createAidCampaign,
  updateAidCampaign,
  deleteAidCampaign,
} from '../../api/aidRequests';
import { uploadMedia } from '../../api/media';
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

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AidRequestsAdmin() {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'campaigns'

  // Tab 1: Requests state
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Tab 2: Campaigns state
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    slug: '',
    description: '',
    image: '',
    isActive: true,
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [copiedCampaignSlug, setCopiedCampaignSlug] = useState(null);
  const [deletingCampaignId, setDeletingCampaignId] = useState(null);
  const fileInputRef = useRef(null);

  // Modal / Detail permohonan state
  const [selectedItem, setSelectedItem] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Load campaigns
  const loadCampaigns = async () => {
    setCampaignsLoading(true);
    try {
      const res = await getAidCampaigns();
      setCampaigns(res.data || []);
    } catch {
      /* ignore */
    } finally {
      setCampaignsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const { data, loading, error, refetch } = useFetch(
    () =>
      getAidRequests({
        page,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        campaignId: campaignFilter || undefined,
        q: activeQuery || undefined,
      }),
    [page, statusFilter, typeFilter, campaignFilter, activeQuery],
  );

  const requests = data?.data || [];
  const meta = data?.meta || {};
  const summary = data?.summary || {};

  const handleCopyLink = (url) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCampaignLink = (slug) => {
    const url = `${window.location.origin}/ajukan-bantuan/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedCampaignSlug(slug);
      setTimeout(() => setCopiedCampaignSlug(null), 2000);
    }
  };

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

  const handleStatusChange = async (id, status) => {
    try {
      await updateAidRequestStatus(id, { status });
      refetch();
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const handleDelete = async (id, ticketNumber) => {
    if (!window.confirm(`Hapus permohonan dengan tiket ${ticketNumber}?`)) return;

    setDeletingId(id);
    try {
      await deleteAidRequest(id);
      refetch();
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setDeletingId(null);
    }
  };

  // Campaign handlers
  const handleOpenCreateCampaign = () => {
    setEditingCampaign(null);
    setCampaignForm({
      title: '',
      slug: '',
      description: '',
      image: '',
      isActive: true,
    });
    setSlugTouched(false);
    setCampaignModalOpen(true);
  };

  const handleOpenEditCampaign = (c) => {
    setEditingCampaign(c);
    setCampaignForm({
      title: c.title,
      slug: c.slug,
      description: c.description || '',
      image: c.image || '',
      isActive: c.isActive,
    });
    setSlugTouched(true);
    setCampaignModalOpen(true);
  };

  const handleCampaignTitleChange = (val) => {
    setCampaignForm((prev) => ({
      ...prev,
      title: val,
      slug: slugTouched ? prev.slug : slugify(val),
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadMedia(file);
      if (res?.data?.url) {
        setCampaignForm((prev) => ({ ...prev, image: res.data.url }));
      }
    } catch (err) {
      alert(errMsg(err, 'Gagal mengunggah gambar'));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.title.trim()) {
      alert('Nama event atau program wajib diisi');
      return;
    }

    setSavingCampaign(true);
    try {
      const payload = {
        title: campaignForm.title.trim(),
        slug: campaignForm.slug.trim() ? slugify(campaignForm.slug) : slugify(campaignForm.title),
        description: campaignForm.description.trim() || null,
        image: campaignForm.image.trim() || null,
        isActive: campaignForm.isActive,
      };

      if (editingCampaign) {
        await updateAidCampaign(editingCampaign.id, payload);
      } else {
        await createAidCampaign(payload);
      }

      setCampaignModalOpen(false);
      loadCampaigns();
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleToggleCampaignStatus = async (c) => {
    try {
      await updateAidCampaign(c.id, { isActive: !c.isActive });
      loadCampaigns();
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const handleDeleteCampaign = async (c) => {
    if (!window.confirm(`Hapus formulir event "${c.title}"? Seluruh permohonan yang terkait akan tetap tersimpan.`)) return;

    setDeletingCampaignId(c.id);
    try {
      await deleteAidCampaign(c.id);
      loadCampaigns();
      if (campaignFilter === c.id) setCampaignFilter('');
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setDeletingCampaignId(null);
    }
  };

  const generalPortalUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/ajukan-bantuan`;

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
            Permohonan Bantuan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola formulir permohonan bantuan kemanusiaan dan verifikasi pengajuan masuk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreateCampaign}
            className="admin-btn-primary !py-1.5 !px-3 text-xs"
          >
            <FontAwesomeIcon icon={['fa-solid', 'fa-plus']} />
            <span>Buat Event Baru</span>
          </button>

          <a
            href="/ajukan-bantuan"
            target="_blank"
            rel="noreferrer"
            className="admin-btn-secondary !py-1.5 !px-3 text-xs"
            title="Buka portal formulir permohonan bantuan di tab baru"
          >
            <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-up-right-from-square']} />
            <span className="hidden sm:inline">Formulir Umum</span>
          </a>
        </div>
      </div>

      {/* Navigasi Tab */}
      <div className="flex border-b border-slate-200 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
            activeTab === 'requests'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FontAwesomeIcon icon={['fa-solid', 'fa-inbox']} />
          <span>Daftar Permohonan</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-bold">
            {summary.totalAll || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
            activeTab === 'campaigns'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FontAwesomeIcon icon={['fa-solid', 'fa-calendar-check']} />
          <span>Formulir Khusus / Event</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-bold">
            {campaigns.length}
          </span>
        </button>
      </div>

      {/* KONTEN TAB 1: DAFTAR PERMOHONAN */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Card Info Tautan Umum (Desain Netral Slate) */}
          <div className="admin-card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
                <FontAwesomeIcon icon={['fa-solid', 'fa-link']} className="text-xs" />
              </span>
              <div>
                <p className="font-bold text-slate-900">Tautan Formulir Umum</p>
                <p className="text-slate-500 mt-0.5">
                  Tautan pengajuan umum:{' '}
                  <code className="rounded bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-800 border border-slate-200">
                    {generalPortalUrl}
                  </code>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopyLink(generalPortalUrl)}
              className="admin-btn-secondary !py-1 !px-2.5 text-xs self-start sm:self-auto"
            >
              <FontAwesomeIcon icon={['fa-solid', copiedLink ? 'fa-check' : 'fa-copy']} />
              <span>{copiedLink ? 'Tersalin' : 'Salin Link'}</span>
            </button>
          </div>

          {/* Counter Ringkasan Netral */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="admin-card p-3.5">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-inbox']} className="text-xs" />
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
              </div>
              <p className="mt-2.5 font-heading text-xl font-bold text-slate-900">{summary.totalAll || 0}</p>
              <p className="text-[11px] text-slate-400">
                {summary.danaCount || 0} Dana · {summary.barangCount || 0} Barang
              </p>
            </div>

            <div className="admin-card p-3.5">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-clock']} className="text-xs" />
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Menunggu</span>
              </div>
              <p className="mt-2.5 font-heading text-xl font-bold text-slate-900">{summary.pendingCount || 0}</p>
              <p className="text-[11px] text-slate-400">Perlu diverifikasi</p>
            </div>

            <div className="admin-card p-3.5">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-user-check']} className="text-xs" />
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ditinjau</span>
              </div>
              <p className="mt-2.5 font-heading text-xl font-bold text-slate-900">{summary.reviewedCount || 0}</p>
              <p className="text-[11px] text-slate-400">Sedang ditinjau</p>
            </div>

            <div className="admin-card p-3.5">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-circle-check']} className="text-xs" />
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disetujui</span>
              </div>
              <p className="mt-2.5 font-heading text-xl font-bold text-slate-900">{summary.approvedCount || 0}</p>
              <p className="text-[11px] text-slate-400">Disetujui</p>
            </div>

            <div className="admin-card p-3.5 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-ban']} className="text-xs" />
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ditolak</span>
              </div>
              <p className="mt-2.5 font-heading text-xl font-bold text-slate-900">{summary.rejectedCount || 0}</p>
              <p className="text-[11px] text-slate-400">Ditolak</p>
            </div>
          </div>

          {/* Filter & Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filter Status */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="input !w-auto !py-1.5 text-xs font-medium"
              >
                <option value="">Semua Status</option>
                <option value="PENDING">Menunggu</option>
                <option value="REVIEWED">Sedang Ditinjau</option>
                <option value="APPROVED">Disetujui</option>
                <option value="REJECTED">Ditolak</option>
              </select>

              {/* Filter Bentuk */}
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="input !w-auto !py-1.5 text-xs font-medium"
              >
                <option value="">Semua Bentuk</option>
                <option value="DANA">Dana Tunai</option>
                <option value="BARANG">Barang</option>
              </select>

              {/* Filter Event / Kampanye */}
              <select
                value={campaignFilter}
                onChange={(e) => {
                  setCampaignFilter(e.target.value);
                  setPage(1);
                }}
                className="input !w-auto !py-1.5 text-xs font-medium"
              >
                <option value="">Semua Sumber Formulir</option>
                <option value="none">Formulir Umum (Tanpa Event)</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    Event: {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Pencarian */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tiket, lembaga, nama..."
                className="input !py-1.5 pl-8 text-xs w-full"
              />
              <FontAwesomeIcon
                icon={['fa-solid', 'fa-magnifying-glass']}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
              />
            </form>
          </div>

          {/* Tabel Data Permohonan */}
          {loading ? (
            <Spinner label="Memuat permohonan bantuan..." />
          ) : error ? (
            <EmptyState
              icon="fa-triangle-exclamation"
              title="Gagal Memuat Data"
              description={errMsg(error)}
            />
          ) : requests.length === 0 ? (
            <EmptyState
              icon="fa-inbox"
              title="Belum Ada Permohonan Masuk"
              description="Data permohonan yang diajukan oleh majelis atau lembaga akan tercatat di sini."
            />
          ) : (
            <div className="admin-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-xs">
                  <thead>
                    <tr>
                      <th className="admin-th">Tiket & Waktu</th>
                      <th className="admin-th">Lembaga & Pimpinan</th>
                      <th className="admin-th">PJ Lapangan</th>
                      <th className="admin-th">Bantuan & Kebutuhan</th>
                      <th className="admin-th">Sumber / Event</th>
                      <th className="admin-th">Status & Ubah</th>
                      <th className="admin-th text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map((item) => (
                      <tr key={item.id} className="transition hover:bg-slate-50/70">
                        {/* No Tiket */}
                        <td className="admin-td">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(item)}
                            className="font-mono text-xs font-bold text-slate-900 hover:text-slate-600 hover:underline block text-left"
                          >
                            {item.ticketNumber}
                          </button>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {formatDate(item.createdAt, 'd MMM yyyy, HH:mm')}
                          </span>
                        </td>

                        {/* Lembaga & Pimpinan */}
                        <td className="admin-td">
                          <p className="font-bold text-slate-900">{item.institutionName}</p>
                          <div className="mt-0.5 flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <span>Pimp: {item.leaderName}</span>
                            <a
                              href={`https://wa.me/${cleanPhoneForWa(item.leaderPhone)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-emerald-700"
                              title={`WhatsApp ${item.leaderName}`}
                            >
                              <FontAwesomeIcon icon={['fa-brands', 'fa-whatsapp']} />
                            </a>
                          </div>
                        </td>

                        {/* PJ */}
                        <td className="admin-td">
                          <p className="font-semibold text-slate-800">{item.picName}</p>
                          <a
                            href={`https://wa.me/${cleanPhoneForWa(item.picPhone)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-700 mt-0.5"
                          >
                            <FontAwesomeIcon icon={['fa-brands', 'fa-whatsapp']} />
                            <span>{item.picPhone}</span>
                          </a>
                        </td>

                        {/* Bantuan & Kebutuhan (Desain Netral Slate) */}
                        <td className="admin-td">
                          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            <FontAwesomeIcon
                              icon={['fa-solid', item.type === 'DANA' ? 'fa-sack-dollar' : 'fa-box-open']}
                              className="text-slate-400"
                            />
                            <span>{item.type === 'DANA' ? 'Dana' : 'Barang'}</span>
                          </span>
                          <p className="mt-1 font-heading text-xs font-bold text-slate-900 line-clamp-1">
                            {item.amountOrGoods}
                          </p>
                        </td>

                        {/* Sumber / Event */}
                        <td className="admin-td">
                          {item.campaign ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 text-[10px] font-medium"
                              title={`Event: ${item.campaign.title}`}
                            >
                              <FontAwesomeIcon icon={['fa-solid', 'fa-calendar-check']} className="text-[9px] text-slate-500" />
                              <span className="max-w-[110px] truncate">{item.campaign.title}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Umum</span>
                          )}
                        </td>

                        {/* Status & Ubah (Desain Netral Bersih) */}
                        <td className="admin-td">
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:border-slate-400 focus:outline-none shadow-2xs transition"
                          >
                            <option value="PENDING">● Menunggu</option>
                            <option value="REVIEWED">● Ditinjau</option>
                            <option value="APPROVED">● Disetujui</option>
                            <option value="REJECTED">● Ditolak</option>
                          </select>
                        </td>

                        {/* Aksi */}
                        <td className="admin-td text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(item)}
                              className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                              title="Lihat Rincian"
                            >
                              <FontAwesomeIcon icon={['fa-solid', 'fa-eye']} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id, item.ticketNumber)}
                              disabled={deletingId === item.id}
                              className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition shadow-2xs"
                              title="Hapus"
                            >
                              <FontAwesomeIcon icon={['fa-solid', 'fa-trash']} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginasi */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                  <span>
                    Halaman {meta.page} dari {meta.totalPages} ({meta.total} total)
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="admin-btn-secondary !py-1 !px-2.5 text-xs disabled:opacity-40"
                    >
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="admin-btn-secondary !py-1 !px-2.5 text-xs disabled:opacity-40"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* KONTEN TAB 2: FORMULIR KHUSUS / EVENT */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Formulir Event & Program Khusus</h2>
              <p className="text-xs text-slate-500">
                Buat tautan dan halaman pendaftaran mandiri untuk program tertentu yang dapat langsung disebar.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateCampaign}
              className="admin-btn-primary !py-1.5 !px-3 text-xs"
            >
              <FontAwesomeIcon icon={['fa-solid', 'fa-plus']} />
              <span>Buat Event Baru</span>
            </button>
          </div>

          {campaignsLoading ? (
            <Spinner label="Memuat event..." />
          ) : campaigns.length === 0 ? (
            <EmptyState
              icon="fa-calendar-plus"
              title="Belum Ada Formulir Event Khusus"
              description="Anda dapat membuat halaman pendaftaran khusus (misal: Wiladah Rasulullah) lengkap dengan link mandiri dan gambar poster."
            />
          ) : (
            <div className="admin-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-xs">
                  <thead>
                    <tr>
                      <th className="admin-th">Banner</th>
                      <th className="admin-th">Nama Program / Event</th>
                      <th className="admin-th">Tautan Khusus</th>
                      <th className="admin-th text-center">Pengajuan Masuk</th>
                      <th className="admin-th">Status</th>
                      <th className="admin-th text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {campaigns.map((c) => {
                      const portalUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/ajukan-bantuan/${c.slug}`;
                      return (
                        <tr key={c.id} className="transition hover:bg-slate-50/70">
                          {/* Banner */}
                          <td className="admin-td w-16">
                            {c.image ? (
                              <img
                                src={c.image}
                                alt={c.title}
                                className="h-10 w-14 rounded-lg object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-400 border border-slate-200/80">
                                <FontAwesomeIcon icon={['fa-solid', 'fa-image']} className="text-xs" />
                              </div>
                            )}
                          </td>

                          {/* Nama Event */}
                          <td className="admin-td">
                            <p className="font-bold text-slate-900">{c.title}</p>
                            {c.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{c.description}</p>
                            )}
                          </td>

                          {/* Tautan Khusus */}
                          <td className="admin-td">
                            <div className="flex items-center gap-1.5">
                              <code className="rounded bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-700 border border-slate-200">
                                /ajukan-bantuan/{c.slug}
                              </code>
                              <button
                                type="button"
                                onClick={() => handleCopyCampaignLink(c.slug)}
                                className="admin-btn-secondary !py-0.5 !px-2 text-[10px]"
                                title="Salin tautan"
                              >
                                <FontAwesomeIcon icon={['fa-solid', copiedCampaignSlug === c.slug ? 'fa-check' : 'fa-copy']} />
                                <span>{copiedCampaignSlug === c.slug ? 'Tersalin' : 'Salin'}</span>
                              </button>
                            </div>
                          </td>

                          {/* Pengajuan Masuk */}
                          <td className="admin-td text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setCampaignFilter(c.id);
                                setActiveTab('requests');
                              }}
                              className="font-heading font-bold text-slate-900 hover:underline inline-flex items-center gap-1"
                              title="Lihat pengajuan event ini"
                            >
                              <span>{c._count?.requests || 0}</span>
                              <span className="text-[11px] text-slate-400 font-normal">pengajuan</span>
                            </button>
                          </td>

                          {/* Status Aktif / Tutup */}
                          <td className="admin-td">
                            <button
                              type="button"
                              onClick={() => handleToggleCampaignStatus(c)}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition ${
                                c.isActive
                                  ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                  : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100'
                              }`}
                              title="Klik untuk mengubah status buka/tutup"
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${c.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              <span>{c.isActive ? 'Terbuka' : 'Ditutup'}</span>
                            </button>
                          </td>

                          {/* Aksi */}
                          <td className="admin-td text-right">
                            <div className="inline-flex items-center gap-1">
                              <a
                                href={`/ajukan-bantuan/${c.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                                title="Buka Formulir di Tab Baru"
                              >
                                <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-up-right-from-square']} />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleOpenEditCampaign(c)}
                                className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                                title="Edit Event"
                              >
                                <FontAwesomeIcon icon={['fa-solid', 'fa-pen']} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCampaign(c)}
                                disabled={deletingCampaignId === c.id}
                                className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition shadow-2xs"
                                title="Hapus Event"
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
            </div>
          )}
        </div>
      )}

      {/* MODAL BUAT / EDIT EVENT KHUSUS */}
      {campaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="admin-card w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-base font-bold text-slate-900">
                {editingCampaign ? 'Edit Formulir Event' : 'Buat Formulir Event Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setCampaignModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <FontAwesomeIcon icon={['fa-solid', 'fa-xmark']} />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="space-y-4 text-xs">
              {/* Nama Program / Event */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Nama Program / Event <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={campaignForm.title}
                  onChange={(e) => handleCampaignTitleChange(e.target.value)}
                  placeholder="Misal: Wiladah Rasulullah 1448H"
                  required
                  className="input !text-xs !py-2"
                />
              </div>

              {/* Tautan URL Slug */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Tautan Slug URL <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-2.5 py-2 text-slate-500 font-mono text-[11px]">
                    /ajukan-bantuan/
                  </span>
                  <input
                    type="text"
                    value={campaignForm.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setCampaignForm((p) => ({ ...p, slug: e.target.value }));
                    }}
                    placeholder="wiladah-rasulullah"
                    required
                    className="input !text-xs !py-2 !rounded-l-none font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  URL ini akan otomatis menjadi tautan formulir yang bisa dibagikan.
                </p>
              </div>

              {/* Gambar Banner Poster (Opsional) */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Gambar Banner / Poster (Opsional)
                </label>
                {campaignForm.image ? (
                  <div className="relative mb-2 rounded-xl overflow-hidden border border-slate-200 max-h-36">
                    <img
                      src={campaignForm.image}
                      alt="Preview banner"
                      className="w-full h-36 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setCampaignForm((p) => ({ ...p, image: '' }))}
                      className="absolute top-2 right-2 rounded-lg bg-slate-900/70 px-2 py-1 text-[11px] text-white hover:bg-slate-900 transition"
                    >
                      Hapus Gambar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={campaignForm.image}
                      onChange={(e) => setCampaignForm((p) => ({ ...p, image: e.target.value }))}
                      placeholder="Masukkan URL gambar atau unggah..."
                      className="input !text-xs !py-2 flex-1"
                    />
                    <label className="admin-btn-secondary !py-2 !px-3 cursor-pointer shrink-0">
                      {uploadingImage ? (
                        <span>Mengunggah...</span>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={['fa-solid', 'fa-upload']} />
                          <span>Unggah</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Gambar opsional yang akan ditampilkan di bagian atas formulir pendaftaran.
                </p>
              </div>

              {/* Deskripsi Singkat */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Keterangan / Pengantar Singkat (Opsional)
                </label>
                <textarea
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="Catatan pengantar yang tampil di bawah judul formulir..."
                  className="input !text-xs !py-2"
                />
              </div>

              {/* Status Pendaftaran */}
              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={campaignForm.isActive}
                    onChange={(e) => setCampaignForm((p) => ({ ...p, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                  />
                  <div>
                    <p className="font-semibold text-slate-800">Buka Pendaftaran Permohonan</p>
                    <p className="text-[10px] text-slate-400">
                      Jika dimatikan, formulir event ini tidak dapat menerima kiriman baru.
                    </p>
                  </div>
                </label>
              </div>

              {/* Tombol Aksi Modal */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setCampaignModalOpen(false)}
                  className="admin-btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingCampaign}
                  className="admin-btn-primary"
                >
                  {savingCampaign ? 'Menyimpan...' : editingCampaign ? 'Simpan Perubahan' : 'Buat Formulir Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL & EDIT STATUS PERMOHONAN */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="admin-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-slate-900">
                    {selectedItem.ticketNumber}
                  </span>
                  <StatusBadge status={selectedItem.status} />
                  {selectedItem.campaign && (
                    <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                      Event: {selectedItem.campaign.title}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
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

            {/* Rincian Permohonan Netral */}
            <div className="grid gap-3 text-xs sm:grid-cols-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div>
                <span className="font-semibold text-slate-400 text-[10px] uppercase">Lembaga / Majelis:</span>
                <p className="font-bold text-slate-900 text-sm">{selectedItem.institutionName}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-400 text-[10px] uppercase">Kebutuhan:</span>
                <p className="font-bold text-slate-900 text-sm">
                  [{selectedItem.type === 'DANA' ? 'Dana Tunai' : 'Barang'}] {selectedItem.amountOrGoods}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-400 text-[10px] uppercase">Pimpinan:</span>
                <p className="text-slate-900 font-medium">
                  {selectedItem.leaderName}
                </p>
                <a
                  href={`https://wa.me/${cleanPhoneForWa(selectedItem.leaderPhone)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-medium"
                >
                  <FontAwesomeIcon icon={['fa-brands', 'fa-whatsapp']} />
                  <span>{selectedItem.leaderPhone}</span>
                </a>
              </div>

              <div>
                <span className="font-semibold text-slate-400 text-[10px] uppercase">Penanggung Jawab (PJ):</span>
                <p className="text-slate-900 font-medium">
                  {selectedItem.picName}
                </p>
                <a
                  href={`https://wa.me/${cleanPhoneForWa(selectedItem.picPhone)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-medium"
                >
                  <FontAwesomeIcon icon={['fa-brands', 'fa-whatsapp']} />
                  <span>{selectedItem.picPhone}</span>
                </a>
              </div>
            </div>

            {/* Alasan / Urgensi */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Alasan / Urgensi Kebutuhan:
              </h4>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700 whitespace-pre-line max-h-40 overflow-y-auto">
                {selectedItem.reason}
              </div>
            </div>

            {/* Form Ubah Status & Catatan */}
            <form onSubmit={handleStatusSubmit} className="border-t border-slate-100 pt-3 space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Verifikasi & Keputusan Status:
              </h4>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="modalStatus" className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Permohonan
                  </label>
                  <select
                    id="modalStatus"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="input !text-xs !py-2 w-full"
                  >
                    <option value="PENDING">Menunggu Verifikasi</option>
                    <option value="REVIEWED">Sedang Ditinjau</option>
                    <option value="APPROVED">Disetujui</option>
                    <option value="REJECTED">Ditolak</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modalNotes" className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Internal Admin (Opsional)
                  </label>
                  <input
                    type="text"
                    id="modalNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Catatan tim verifikasi..."
                    className="input !text-xs !py-2 w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="admin-btn-secondary"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="admin-btn-primary"
                >
                  {updating ? 'Menyimpan...' : 'Simpan Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
