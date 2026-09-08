import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Seo from '../components/Seo';
import { useSettings } from '../context/SettingsContext';
import { submitAidRequest, getPublicAidCampaign } from '../api/aidRequests';
import Spinner from '../components/ui/Spinner';

function PortalHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 group py-1" title="Kembali ke Website Utama">
          <img
            src="/logo.png"
            alt="Logo Yayasan Cinta Kasih Fatimah"
            className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <div className="flex flex-col justify-center leading-none select-none text-slate-900">
            <span className="font-heading text-[10px] font-extrabold uppercase tracking-wider text-slate-900">
              CINTA KASIH
            </span>
            <span className="font-heading text-[13px] font-black uppercase tracking-wide mt-0.5 text-black">
              FATIMAH
            </span>
            <span className="font-sans text-[7px] font-bold uppercase tracking-[0.2em] mt-0.5 text-slate-600">
              FOUNDATION
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900 transition shadow-2xs"
          >
            <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-left']} className="text-[10px]" />
            <span>Web Utama</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function PortalFooter({ phone, email }) {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 text-xs text-slate-500">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <p className="font-semibold text-slate-800 text-xs">Yayasan Cinta Kasih Fatimah</p>
        <p className="mt-1 text-[11px] text-slate-500 max-w-md mx-auto">
          Portal permohonan bantuan resmi. Pengajuan 100% bebas biaya dan seluruh data dijaga kerahasiaannya.
        </p>
        {(phone || email) && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-600">
            {phone && (
              <span className="inline-flex items-center gap-1.5">
                <FontAwesomeIcon icon={['fa-solid', 'fa-phone']} className="text-slate-400 text-xs" />
                <span>{phone}</span>
              </span>
            )}
            {email && (
              <span className="inline-flex items-center gap-1.5">
                <FontAwesomeIcon icon={['fa-solid', 'fa-envelope']} className="text-slate-400 text-xs" />
                <span>{email}</span>
              </span>
            )}
          </div>
        )}
        <p className="mt-3 text-[10px] text-slate-400">
          © {new Date().getFullYear()} Cinta Kasih Fatimah Foundation.
        </p>
      </div>
    </footer>
  );
}

const PRESET_AMOUNTS = [
  { label: 'Rp 2,5 Juta', value: 2500000 },
  { label: 'Rp 5 Juta', value: 5000000 },
  { label: 'Rp 10 Juta', value: 10000000 },
];

function formatRupiah(num) {
  if (!num) return '';
  return new Intl.NumberFormat('id-ID').format(num);
}

export default function AidRequest() {
  const { slug } = useParams();
  const { settings } = useSettings();

  const [campaign, setCampaign] = useState(null);
  const [loadingCampaign, setLoadingCampaign] = useState(Boolean(slug));
  const [campaignNotFound, setCampaignNotFound] = useState(false);

  const [requestType, setRequestType] = useState('DANA'); // 'DANA' | 'BARANG'
  const [sameAsLeader, setSameAsLeader] = useState(false);

  const [formData, setFormData] = useState({
    institutionName: '',
    leaderName: '',
    leaderPhone: '',
    picName: '',
    picPhone: '',
    rawAmount: '5000000',
    goodsDescription: '',
    reason: '',
    consentAgreement: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submissionResult, setSubmissionResult] = useState(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoadingCampaign(false);
      setCampaign(null);
      return;
    }

    let isMounted = true;
    setLoadingCampaign(true);
    setCampaignNotFound(false);

    getPublicAidCampaign(slug)
      .then((res) => {
        if (isMounted) {
          setCampaign(res.data);
          setLoadingCampaign(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCampaignNotFound(true);
          setLoadingCampaign(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      if (sameAsLeader && (name === 'leaderName' || name === 'leaderPhone')) {
        if (name === 'leaderName') next.picName = value;
        if (name === 'leaderPhone') next.picPhone = value;
      }
      return next;
    });
  };

  const handleSameAsLeaderToggle = (e) => {
    const checked = e.target.checked;
    setSameAsLeader(checked);
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        picName: prev.leaderName,
        picPhone: prev.leaderPhone,
      }));
    }
  };

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, rawAmount: val }));
  };

  const handlePresetSelect = (val) => {
    setFormData((prev) => ({ ...prev, rawAmount: String(val) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.institutionName.trim()) {
      setErrorMessage('Nama majelis atau lembaga wajib diisi.');
      return;
    }
    if (!formData.leaderName.trim() || !formData.leaderPhone.trim()) {
      setErrorMessage('Nama dan nomor WhatsApp pimpinan wajib diisi.');
      return;
    }

    const finalPicName = sameAsLeader ? formData.leaderName.trim() : formData.picName.trim();
    const finalPicPhone = sameAsLeader ? formData.leaderPhone.trim() : formData.picPhone.trim();

    if (!finalPicName || !finalPicPhone) {
      setErrorMessage('Nama dan nomor WhatsApp penanggung jawab (PJ) wajib diisi.');
      return;
    }

    let amountOrGoods = '';
    if (requestType === 'DANA') {
      const num = parseInt(formData.rawAmount, 10);
      if (!num || num <= 0) {
        setErrorMessage('Silakan masukkan nominal dana yang dibutuhkan.');
        return;
      }
      amountOrGoods = `Rp ${formatRupiah(num)}`;
    } else {
      if (!formData.goodsDescription.trim()) {
        setErrorMessage('Silakan rincikan kebutuhan barang atau logistik.');
        return;
      }
      amountOrGoods = formData.goodsDescription.trim();
    }

    if (!formData.reason.trim() || formData.reason.trim().length < 10) {
      setErrorMessage('Mohon tuliskan penjelasan alasan atau urgensi permohonan secara ringkas.');
      return;
    }

    if (!formData.consentAgreement) {
      setErrorMessage('Mohon centang pernyataan persetujuan sebelum mengirimkan permohonan.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type: requestType,
        campaignSlug: slug || undefined,
        campaignId: campaign?.id || undefined,
        institutionName: formData.institutionName.trim(),
        leaderName: formData.leaderName.trim(),
        leaderPhone: formData.leaderPhone.trim(),
        picName: finalPicName,
        picPhone: finalPicPhone,
        amountOrGoods,
        reason: formData.reason.trim(),
        agreementConsent: true,
      };

      const res = await submitAidRequest(payload);
      setSubmissionResult(res.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Terjadi kendala saat mengirim permohonan.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyTicket = (ticket) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ticket);
      setCopiedTicket(true);
      setTimeout(() => setCopiedTicket(false), 2000);
    }
  };

  if (loadingCampaign) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-slate-50 font-sans text-slate-700">
        <PortalHeader />
        <main className="my-auto py-16 text-center">
          <Spinner label="Memuat formulir..." />
        </main>
        <PortalFooter phone={settings.phone} email={settings.email} />
      </div>
    );
  }

  // Jika campaign slug tidak ditemukan
  if (slug && campaignNotFound) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-slate-50 font-sans text-slate-700">
        <Seo title="Formulir Tidak Ditemukan - Cinta Kasih Fatimah" description="Formulir permohonan bantuan" />
        <PortalHeader />
        <main className="mx-auto max-w-md px-4 py-16 text-center my-auto">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-400">
              <FontAwesomeIcon icon={['fa-solid', 'fa-link-slash']} />
            </span>
            <h2 className="mt-4 font-heading text-lg font-bold text-slate-900">
              Formulir Event Tidak Ditemukan
            </h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Tautan formulir khusus ini mungkin sudah kadaluarsa atau salah penulisan.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/ajukan-bantuan" className="admin-btn-primary !py-2 !px-4 text-xs">
                Ke Formulir Umum
              </Link>
            </div>
          </div>
        </main>
        <PortalFooter phone={settings.phone} email={settings.email} />
      </div>
    );
  }

  // Jika event khusus non-aktif
  if (campaign && !campaign.isActive) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-slate-50 font-sans text-slate-700">
        <Seo title={`${campaign.title} Ditutup - Cinta Kasih Fatimah`} description="Formulir permohonan bantuan" />
        <PortalHeader />
        <main className="mx-auto max-w-md px-4 py-16 text-center my-auto">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-400">
              <FontAwesomeIcon icon={['fa-solid', 'fa-lock']} />
            </span>
            <h2 className="mt-4 font-heading text-lg font-bold text-slate-900">
              Penerimaan Telah Ditutup
            </h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Penerimaan permohonan bantuan untuk program <strong>{campaign.title}</strong> saat ini telah ditutup oleh panitia.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/" className="admin-btn-secondary !py-2 !px-4 text-xs">
                Ke Website Utama
              </Link>
            </div>
          </div>
        </main>
        <PortalFooter phone={settings.phone} email={settings.email} />
      </div>
    );
  }

  // Jika bukan event khusus tapi setting permohonan umum ditutup
  if (!slug && settings.menu_bantuan_enabled === 'false') {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-slate-50 font-sans text-slate-700">
        <Seo title="Permohonan Ditutup - Cinta Kasih Fatimah" description="Layanan permohonan bantuan" />
        <PortalHeader />
        <main className="mx-auto max-w-md px-4 py-16 text-center my-auto">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-400">
              <FontAwesomeIcon icon={['fa-solid', 'fa-hand-holding-hand']} />
            </span>
            <h2 className="mt-4 font-heading text-lg font-bold text-slate-900">
              Penerimaan Permohonan Ditutup
            </h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Saat ini kanal permohonan bantuan umum sedang tidak menerima pengajuan baru.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/" className="admin-btn-secondary !py-2 !px-4 text-xs">
                Ke Website Utama
              </Link>
            </div>
          </div>
        </main>
        <PortalFooter phone={settings.phone} email={settings.email} />
      </div>
    );
  }

  const pageTitle = campaign
    ? `${campaign.title} - Permohonan Bantuan`
    : 'Formulir Permohonan Bantuan - Cinta Kasih Fatimah';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 font-sans text-slate-700">
      <Seo
        title={pageTitle}
        description={campaign?.description || 'Formulir permohonan bantuan kemanusiaan Yayasan Cinta Kasih Fatimah.'}
      />
      <PortalHeader />

      <main className="flex-1 mx-auto w-full max-w-xl px-4 py-8 sm:py-10">
        {submissionResult ? (
          /* STATE SUKSES COMPACT */
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm text-center animate-fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-800 border border-slate-200">
              <FontAwesomeIcon icon={['fa-solid', 'fa-check']} />
            </div>

            <h2 className="mt-4 font-heading text-xl font-bold text-slate-900">
              Permohonan Berhasil Dikirim
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              Data permohonan untuk <strong>{submissionResult.institutionName}</strong> telah tersimpan dan akan diverifikasi oleh tim pengelola.
            </p>

            {/* Box Tiket */}
            <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200/80 p-4 text-left">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Nomor Registrasi</p>
                  <p className="font-mono text-base font-bold text-slate-900">{submissionResult.ticketNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyTicket(submissionResult.ticketNumber)}
                  className="admin-btn-secondary !py-1 !px-2.5 text-[11px]"
                >
                  <FontAwesomeIcon icon={['fa-solid', copiedTicket ? 'fa-check' : 'fa-copy']} />
                  <span>{copiedTicket ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Bantuan:</span>
                  <span className="font-semibold text-slate-800">
                    [{submissionResult.type === 'DANA' ? 'Dana Tunai' : 'Barang'}] {submissionResult.amountOrGoods}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pimpinan:</span>
                  <span className="text-slate-800">{submissionResult.leaderName} ({submissionResult.leaderPhone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Penanggung Jawab:</span>
                  <span className="text-slate-800">{submissionResult.picName} ({submissionResult.picPhone})</span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-[11px] text-slate-400 leading-normal">
              Simpan nomor registrasi di atas. Tim kami akan menghubungi kontak tertera untuk koordinasi selanjutnya.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmissionResult(null);
                  setFormData({
                    institutionName: '',
                    leaderName: '',
                    leaderPhone: '',
                    picName: '',
                    picPhone: '',
                    rawAmount: '5000000',
                    goodsDescription: '',
                    reason: '',
                    consentAgreement: false,
                  });
                  setSameAsLeader(false);
                }}
                className="admin-btn-secondary !py-2 !px-4 text-xs"
              >
                Ajukan Lainnya
              </button>
              <Link to="/" className="admin-btn-primary !py-2 !px-4 text-xs">
                Ke Beranda
              </Link>
            </div>
          </div>
        ) : (
          /* FORMULIR COMPACT & TO THE POINT */
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-sm">
            {/* Header Formulir / Banner Event Opsional */}
            {campaign && campaign.image && (
              <div className="mb-5 overflow-hidden rounded-xl border border-slate-200/80">
                <img
                  src={campaign.image}
                  alt={campaign.title}
                  className="w-full max-h-52 object-cover"
                />
              </div>
            )}

            <div className="mb-6 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200/80">
                  <FontAwesomeIcon icon={['fa-solid', campaign ? 'fa-calendar-check' : 'fa-hand-holding-heart']} className="text-xs" />
                  {campaign ? 'Formulir Program Event' : 'Formulir Bantuan'}
                </span>
                <span className="text-[11px] text-slate-400">· 100% Bebas Biaya</span>
              </div>

              <h1 className="mt-2 font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {campaign ? campaign.title : 'Permohonan Bantuan'}
              </h1>
              {campaign?.description ? (
                <p className="mt-1 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {campaign.description}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Kanal pengajuan bantuan dana atau logistik untuk majelis dan lembaga kemasyarakatan.
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Jenis Bantuan Toggle Switch */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Bentuk Bantuan <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRequestType('DANA')}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-center font-bold transition ${
                      requestType === 'DANA'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FontAwesomeIcon icon={['fa-solid', 'fa-sack-dollar']} />
                    <span>Dana Tunai</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestType('BARANG')}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-center font-bold transition ${
                      requestType === 'BARANG'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FontAwesomeIcon icon={['fa-solid', 'fa-box-open']} />
                    <span>Barang / Logistik</span>
                  </button>
                </div>
              </div>

              {/* Data Lembaga */}
              <div>
                <label htmlFor="institutionName" className="block font-semibold text-slate-800 mb-1">
                  Nama Majelis / Yayasan / Lembaga <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="institutionName"
                  name="institutionName"
                  value={formData.institutionName}
                  onChange={handleChange}
                  placeholder="Contoh: Majelis Ta'lim Nurul Huda"
                  required
                  className="input !text-xs !py-2"
                />
              </div>

              {/* Pimpinan */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="leaderName" className="block font-semibold text-slate-800 mb-1">
                    Nama Pimpinan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="leaderName"
                    name="leaderName"
                    value={formData.leaderName}
                    onChange={handleChange}
                    placeholder="Nama pimpinan lembaga"
                    required
                    className="input !text-xs !py-2"
                  />
                </div>
                <div>
                  <label htmlFor="leaderPhone" className="block font-semibold text-slate-800 mb-1">
                    No. WhatsApp Pimpinan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="leaderPhone"
                    name="leaderPhone"
                    value={formData.leaderPhone}
                    onChange={handleChange}
                    placeholder="08123456789"
                    required
                    className="input !text-xs !py-2"
                  />
                </div>
              </div>

              {/* Penanggung Jawab Lapangan */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-800">
                    Penanggung Jawab (PJ) Lapangan <span className="text-rose-500">*</span>
                  </span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 font-medium">
                    <input
                      type="checkbox"
                      checked={sameAsLeader}
                      onChange={handleSameAsLeaderToggle}
                      className="rounded border-slate-300 accent-slate-900"
                    />
                    <span>Sama dengan Pimpinan</span>
                  </label>
                </div>

                {!sameAsLeader ? (
                  <div className="grid gap-2.5 sm:grid-cols-2 pt-1">
                    <div>
                      <input
                        type="text"
                        id="picName"
                        name="picName"
                        value={formData.picName}
                        onChange={handleChange}
                        placeholder="Nama penanggung jawab"
                        required={!sameAsLeader}
                        className="input !text-xs !py-1.5 bg-white"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        id="picPhone"
                        name="picPhone"
                        value={formData.picPhone}
                        onChange={handleChange}
                        placeholder="No. WA penanggung jawab"
                        required={!sameAsLeader}
                        className="input !text-xs !py-1.5 bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    Data PJ disamakan dengan {formData.leaderName || 'Pimpinan'} ({formData.leaderPhone || '-'}).
                  </p>
                )}
              </div>

              {/* Kebutuhan: Dana vs Barang */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  {requestType === 'DANA' ? 'Nominal Dana yang Dibutuhkan' : 'Rincian Kebutuhan Barang'} <span className="text-rose-500">*</span>
                </label>
                {requestType === 'DANA' ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                        Rp
                      </span>
                      <input
                        type="text"
                        id="rawAmount"
                        name="rawAmount"
                        value={formData.rawAmount ? formatRupiah(formData.rawAmount) : ''}
                        onChange={handleAmountChange}
                        placeholder="5.000.000"
                        required
                        className="input !text-sm !font-bold !pl-9 !py-2 text-slate-900"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-400">Pilihan cepat:</span>
                      {PRESET_AMOUNTS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => handlePresetSelect(p.value)}
                          className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold border transition ${
                            formData.rawAmount === String(p.value)
                              ? 'border-slate-800 bg-slate-800 text-white'
                              : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <textarea
                    id="goodsDescription"
                    name="goodsDescription"
                    value={formData.goodsDescription}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Contoh: 10 rol sajadah musholla dan 50 paket sembako santunan."
                    required
                    className="input !text-xs !py-2"
                  />
                )}
              </div>

              {/* Alasan / Urgensi */}
              <div>
                <label htmlFor="reason" className="block font-semibold text-slate-800 mb-1">
                  Alasan / Urgensi Kebutuhan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Jelaskan ringkas peruntukan bantuan dan urgensi kebutuhan di lapangan..."
                  required
                  className="input !text-xs !py-2 leading-relaxed"
                />
              </div>

              {/* Persetujuan To The Point */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 cursor-pointer hover:bg-slate-50 transition">
                  <input
                    type="checkbox"
                    name="consentAgreement"
                    checked={formData.consentAgreement}
                    onChange={handleChange}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 accent-slate-900"
                  />
                  <span className="text-[11px] text-slate-600 leading-relaxed">
                    Saya menyatakan data yang diisi adalah benar, diajukan secara sadar, dan bersedia diverifikasi oleh tim pengelola Yayasan Cinta Kasih Fatimah.
                  </span>
                </label>
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Tombol Kirim */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="admin-btn-primary w-full !py-2.5 !text-sm font-bold flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" />
                      <span>Mengirimkan...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={['fa-solid', 'fa-paper-plane']} />
                      <span>Kirim Permohonan</span>
                    </>
                  )}
                </button>
                <p className="mt-2 text-center text-[10px] text-slate-400">
                  Data Anda aman dan tidak disebarluaskan ke pihak ketiga.
                </p>
              </div>
            </form>
          </div>
        )}
      </main>

      <PortalFooter phone={settings.phone} email={settings.email} />
    </div>
  );
}
