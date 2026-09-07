import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PageHeader from '../components/layout/PageHeader';
import Seo from '../components/Seo';
import { useSettings } from '../context/SettingsContext';
import { submitAidRequest } from '../api/aidRequests';
import Spinner from '../components/ui/Spinner';

const PRESET_AMOUNTS = [
  { label: 'Rp 2,5 Juta', value: 2500000 },
  { label: 'Rp 5 Juta', value: 5000000 },
  { label: 'Rp 10 Juta', value: 10000000 },
  { label: 'Rp 25 Juta', value: 25000000 },
];

function formatRupiah(num) {
  if (!num) return '';
  return new Intl.NumberFormat('id-ID').format(num);
}

export default function AidRequest() {
  const { settings } = useSettings();

  const [requestType, setRequestType] = useState('DANA'); // 'DANA' | 'BARANG'
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
    consentPrivacy: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submissionResult, setSubmissionResult] = useState(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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

    // Validasi form
    if (!formData.institutionName.trim()) {
      setErrorMessage('Nama majelis atau yayasan wajib diisi.');
      return;
    }
    if (!formData.leaderName.trim() || !formData.leaderPhone.trim()) {
      setErrorMessage('Nama dan nomor WhatsApp pimpinan wajib diisi.');
      return;
    }
    if (!formData.picName.trim() || !formData.picPhone.trim()) {
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
        setErrorMessage('Silakan rincikan jenis dan estimasi kebutuhan barang/logistik.');
        return;
      }
      amountOrGoods = formData.goodsDescription.trim();
    }

    if (!formData.reason.trim() || formData.reason.trim().length < 15) {
      setErrorMessage('Penjelasan alasan permohonan bantuan minimal 15 karakter.');
      return;
    }

    if (!formData.consentAgreement || !formData.consentPrivacy) {
      setErrorMessage('Mohon centang seluruh kotak persetujuan sebelum mengirimkan permohonan.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type: requestType,
        institutionName: formData.institutionName.trim(),
        leaderName: formData.leaderName.trim(),
        leaderPhone: formData.leaderPhone.trim(),
        picName: formData.picName.trim(),
        picPhone: formData.picPhone.trim(),
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
      setTimeout(() => setCopiedTicket(false), 2500);
    }
  };

  // Jika menu bantuan dinonaktifkan di pengaturan admin
  if (settings.menu_bantuan_enabled === 'false') {
    return (
      <>
        <Seo title="Permintaan Bantuan" description="Layanan pengajuan bantuan" />
        <PageHeader title="Layanan Permintaan Bantuan" crumbs={[{ label: 'Bantuan' }]} />
        <section className="container-page max-w-2xl py-16 text-center">
          <div className="card p-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-400">
              <FontAwesomeIcon icon={['fa-solid', 'fa-hand-holding-hand']} />
            </span>
            <h2 className="mt-5 font-heading text-xl font-bold text-slate-900">
              Layanan Permohonan Bantuan Sedang Ditutup
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Saat ini kanal permohonan bantuan sedang tidak menerima pengajuan baru. Untuk informasi kemitraan atau kebutuhan mendesak, silakan hubungi kontak sekretariat kami.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/" className="btn-outline">Kembali ke Beranda</Link>
              <Link to="/kontak" className="btn-primary">Hubungi Kami</Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Seo
        title="Formulir Permintaan Bantuan - Cinta Kasih Fatimah"
        description="Pengajuan permohonan bantuan dana atau barang logistik untuk majelis, yayasan, dan lembaga sosial kemasyarakatan."
      />
      <PageHeader
        title="Permohonan Bantuan"
        subtitle="Kanal resmi pengajuan bantuan dana dan logistik untuk majelis, yayasan, dan lembaga kemasyarakatan."
        crumbs={[{ label: 'Bantuan' }]}
      />

      <div className="container-page py-12 md:py-16">
        {submissionResult ? (
          /* STATE SUKSES */
          <div className="mx-auto max-w-2xl animate-fade-in">
            <div className="card border border-teal-100 p-8 text-center sm:p-10 shadow-lg">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-teal-100 text-3xl text-teal-700">
                <FontAwesomeIcon icon={['fa-solid', 'fa-check']} />
              </div>

              <span className="mt-6 inline-block rounded-full bg-teal-50 px-4 py-1 text-xs font-bold text-teal-700 uppercase tracking-wider">
                Permohonan Diterima
              </span>

              <h2 className="mt-3 font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
                Terima Kasih, Permohonan Anda Berhasil Dikirim
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Data permohonan bantuan untuk <strong>{submissionResult.institutionName}</strong> telah tersimpan di sistem kami dan akan segera ditinjau oleh tim verifikasi.
              </p>

              {/* Box Nomor Tiket */}
              <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200/80 p-5 text-left">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Nomor Tiket Registrasi</p>
                    <p className="font-mono text-xl font-bold text-teal-800">{submissionResult.ticketNumber}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyTicket(submissionResult.ticketNumber)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    <FontAwesomeIcon icon={['fa-solid', copiedTicket ? 'fa-check' : 'fa-copy']} className={copiedTicket ? 'text-teal-600' : ''} />
                    {copiedTicket ? 'Tersalin' : 'Salin Tiket'}
                  </button>
                </div>

                <div className="mt-4 grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
                  <div>
                    <span className="font-medium text-slate-500">Jenis Bantuan:</span>{' '}
                    <span className="font-semibold text-slate-900">
                      {submissionResult.type === 'DANA' ? 'Bantuan Dana Tunai' : 'Bantuan Barang / Logistik'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Kebutuhan:</span>{' '}
                    <span className="font-semibold text-slate-900">{submissionResult.amountOrGoods}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Pimpinan:</span>{' '}
                    <span className="text-slate-800">{submissionResult.leaderName} ({submissionResult.leaderPhone})</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Penanggung Jawab:</span>{' '}
                    <span className="text-slate-800">{submissionResult.picName} ({submissionResult.picPhone})</span>
                  </div>
                </div>
              </div>

              {/* Petunjuk Langkah Selanjutnya */}
              <div className="mt-6 rounded-xl bg-amber-50/80 border border-amber-200/80 p-4 text-left text-xs text-amber-900">
                <div className="flex gap-2.5">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-circle-info']} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold">Langkah Verifikasi Selanjutnya:</p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-amber-800">
                      <li>Tim kami akan menghubungi nomor WhatsApp Penanggung Jawab atau Pimpinan untuk verifikasi dokumen pendukung.</li>
                      <li>Simpan nomor tiket di atas untuk pengecekan atau konfirmasi koordinasi.</li>
                      <li>Seluruh proses pengajuan dan penyaluran bantuan <strong>tidak dipungut biaya apapun (gratis)</strong>.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
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
                      consentPrivacy: false,
                    });
                  }}
                  className="btn-outline text-sm"
                >
                  Ajukan Permohonan Lain
                </button>
                <Link to="/" className="btn-primary text-sm">
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* FORMULIR UTAMA */
          <div className="grid gap-10 lg:grid-cols-12">
            {/* Kolom Kiri: Form */}
            <div className="lg:col-span-8">
              <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-8 shadow-sm">
                {/* 1. Selector Jenis Bantuan */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    1. Jenis Bantuan yang Dimohonkan <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500 mb-4">
                    Pilih bentuk bantuan yang paling sesuai dengan kebutuhan majelis atau yayasan Anda.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRequestType('DANA')}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition ${
                        requestType === 'DANA'
                          ? 'border-teal-600 bg-teal-50/70 text-teal-900 ring-2 ring-teal-500/20 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={['fa-solid', 'fa-sack-dollar']}
                        className={`text-2xl ${requestType === 'DANA' ? 'text-teal-700' : 'text-slate-400'}`}
                      />
                      <span className="font-bold text-sm">Bantuan Dana Tunai</span>
                      <span className="text-[11px] text-slate-500">Dukungan operasional / kegiatan / fasilitas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRequestType('BARANG')}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition ${
                        requestType === 'BARANG'
                          ? 'border-teal-600 bg-teal-50/70 text-teal-900 ring-2 ring-teal-500/20 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={['fa-solid', 'fa-box-open']}
                        className={`text-2xl ${requestType === 'BARANG' ? 'text-teal-700' : 'text-slate-400'}`}
                      />
                      <span className="font-bold text-sm">Bantuan Barang / Logistik</span>
                      <span className="text-[11px] text-slate-500">Perlengkapan, sarana ibadah, sembako, dll</span>
                    </button>
                  </div>
                </div>

                {/* 2. Data Lembaga / Majelis */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="font-heading text-base font-bold text-slate-900 mb-1">
                    2. Identitas Lembaga / Majelis / Yayasan
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Isikan nama entitas dan informasi kontak pimpinan utama.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="institutionName" className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Majelis / Yayasan / Lembaga <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="institutionName"
                        name="institutionName"
                        value={formData.institutionName}
                        onChange={handleChange}
                        placeholder="Contoh: Majelis Ta'lim Nurul Huda"
                        required
                        className="input"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="leaderName" className="block text-xs font-semibold text-slate-700 mb-1">
                          Nama Pimpinan Majelis / Yayasan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="leaderName"
                          name="leaderName"
                          value={formData.leaderName}
                          onChange={handleChange}
                          placeholder="Nama lengkap pimpinan"
                          required
                          className="input"
                        />
                      </div>
                      <div>
                        <label htmlFor="leaderPhone" className="block text-xs font-semibold text-slate-700 mb-1">
                          Nomor WhatsApp Pimpinan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          id="leaderPhone"
                          name="leaderPhone"
                          value={formData.leaderPhone}
                          onChange={handleChange}
                          placeholder="Contoh: 081234567890"
                          required
                          className="input"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Data Penanggung Jawab Lapangan */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="font-heading text-base font-bold text-slate-900 mb-1">
                    3. Data Penanggung Jawab (PJ)
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Pihak pelaksana operasional yang dapat dihubungi secara langsung oleh tim verifikasi.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="picName" className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Penanggung Jawab <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="picName"
                        name="picName"
                        value={formData.picName}
                        onChange={handleChange}
                        placeholder="Nama penanggung jawab"
                        required
                        className="input"
                      />
                    </div>
                    <div>
                      <label htmlFor="picPhone" className="block text-xs font-semibold text-slate-700 mb-1">
                        Nomor WhatsApp Penanggung Jawab <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="picPhone"
                        name="picPhone"
                        value={formData.picPhone}
                        onChange={handleChange}
                        placeholder="Contoh: 081298765432"
                        required
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Kebutuhan Bantuan */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="font-heading text-base font-bold text-slate-900 mb-1">
                    4. {requestType === 'DANA' ? 'Nominal Dana yang Diperlukan' : 'Rincian Kebutuhan Barang'}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    {requestType === 'DANA'
                      ? 'Tentukan estimasi alokasi dana yang dibutuhkan secara wajar dan akuntabel.'
                      : 'Tuliskan jenis barang, spesifikasi, dan kuantitas unit yang dimohonkan.'}
                  </p>

                  {requestType === 'DANA' ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500">
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
                          className="input pl-11 text-base font-bold text-slate-900"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs text-slate-400">Pilihan cepat:</span>
                        {PRESET_AMOUNTS.map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => handlePresetSelect(p.value)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              formData.rawAmount === String(p.value)
                                ? 'bg-teal-700 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <textarea
                        id="goodsDescription"
                        name="goodsDescription"
                        value={formData.goodsDescription}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Contoh: 10 rol karpet sajadah musholla, 1 unit amplifier & mikrofon, serta 50 paket mushaf Al-Qur'an."
                        required
                        className="input"
                      />
                    </div>
                  )}
                </div>

                {/* 5. Alasan / Penjelasan Kebutuhan */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="font-heading text-base font-bold text-slate-900 mb-1">
                    5. Latar Belakang & Alasan Permohonan Bantuan <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Ceritakan kondisi riil di lapangan, latar belakang lembaga, peruntukan bantuan, dan jumlah penerima manfaat yang terbantu.
                  </p>
                  <textarea
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Jelaskan secara mandiri alasan pengajuan, latar belakang lembaga, aktivitas jamaah, dan urgensi kebutuhan bantuan saat ini..."
                    required
                    className="input text-sm leading-relaxed"
                  />
                  <p className="mt-1.5 text-right text-[11px] text-slate-400">
                    {formData.reason.length} karakter
                  </p>
                </div>

                {/* 6. Checkbox Persetujuan */}
                <div className="border-t border-slate-100 pt-6 space-y-3">
                  <h3 className="font-heading text-base font-bold text-slate-900 mb-2">
                    6. Pernyataan & Persetujuan
                  </h3>

                  <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="consentAgreement"
                      checked={formData.consentAgreement}
                      onChange={handleChange}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-teal-700"
                    />
                    <span className="text-xs leading-relaxed text-slate-700">
                      <strong>Persetujuan Permohonan Bantuan:</strong> Saya menyatakan bahwa permohonan ini diajukan secara sadar, tanpa paksaan, dan seluruh data yang diisikan adalah benar serta dapat dipertanggungjawabkan keabsahannya.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="consentPrivacy"
                      checked={formData.consentPrivacy}
                      onChange={handleChange}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-teal-700"
                    />
                    <span className="text-xs leading-relaxed text-slate-700">
                      <strong>Persetujuan Pengiriman Data:</strong> Saya menyetujui nama dan nomor WhatsApp pimpinan serta penanggung jawab di atas dikirimkan dan disimpan sebatas untuk keperluan pendataan, verifikasi faktual, dan koordinasi penyaluran bantuan oleh pihak pengelola.
                    </span>
                  </label>
                </div>

                {errorMessage && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-center gap-2">
                    <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} className="text-sm shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Tombol Submit */}
                <div className="border-t border-slate-100 pt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full py-3.5 text-base font-bold shadow-md shadow-teal-700/20 hover:shadow-teal-700/30 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Spinner size="sm" />
                        <span>Mengirimkan Permohonan...</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={['fa-solid', 'fa-hand-holding-heart']} />
                        <span>Kirim Permohonan Bantuan</span>
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-slate-400">
                    Pastikan nomor WhatsApp yang dimasukkan aktif dan terhubung ke internet.
                  </p>
                </div>
              </form>
            </div>

            {/* Kolom Kanan: Panduan & Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Alur Pengajuan */}
              <div className="card p-6 shadow-sm">
                <h3 className="font-heading text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-list-check']} className="text-teal-700" />
                  Alur Penyaluran Bantuan
                </h3>
                <ol className="relative border-l border-slate-200 pl-4 space-y-5 text-xs text-slate-600">
                  <li className="relative">
                    <span className="absolute -left-[21px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-[11px] font-bold text-teal-800">
                      1
                    </span>
                    <p className="font-bold text-slate-900">Pengajuan Formulir</p>
                    <p className="mt-0.5 leading-relaxed text-slate-500">
                      Isi rincian lembaga, pimpinan, PJ, dan penjelasan kebutuhan bantuan secara lengkap.
                    </p>
                  </li>
                  <li className="relative">
                    <span className="absolute -left-[21px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-[11px] font-bold text-teal-800">
                      2
                    </span>
                    <p className="font-bold text-slate-900">Verifikasi Tim</p>
                    <p className="mt-0.5 leading-relaxed text-slate-500">
                      Tim pengelola akan melakukan pengecekan data dan wawancara klarifikasi via WhatsApp resmi.
                    </p>
                  </li>
                  <li className="relative">
                    <span className="absolute -left-[21px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-[11px] font-bold text-teal-800">
                      3
                    </span>
                    <p className="font-bold text-slate-900">Persetujuan & Penyaluran</p>
                    <p className="mt-0.5 leading-relaxed text-slate-500">
                      Bantuan disalurkan sesuai alokasi dana atau logistik yang disepakati bersama.
                    </p>
                  </li>
                </ol>
              </div>

              {/* Jaminan Integritas */}
              <div className="card p-6 bg-gradient-to-br from-teal-900 to-teal-800 text-white shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg text-amber-400">
                    <FontAwesomeIcon icon={['fa-solid', 'fa-shield-heart']} />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm">Bebas Biaya (Gratis)</h4>
                    <p className="text-[11px] text-teal-200">100% Layanan Sosial</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-teal-100">
                  Seluruh proses permohonan bantuan tidak memungut biaya administrasi atau imbalan apapun. Waspadai pihak yang mengatasnamakan lembaga untuk meminta transfer uang.
                </p>
              </div>

              {/* Bantuan / Kontak Layanan */}
              <div className="card p-6 shadow-sm text-xs text-slate-600">
                <h4 className="font-bold text-sm text-slate-900 mb-2">Butuh Bantuan Pengisian?</h4>
                <p className="leading-relaxed text-slate-500 mb-4">
                  Apabila mengalami kendala dalam pengisian formulir, silakan berkonsultasi melalui narahubung sekretariat kami:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-700">
                    <FontAwesomeIcon icon={['fa-solid', 'fa-phone']} className="text-teal-700 w-3.5" />
                    <span>{settings.phone || '(021) 555-0123'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <FontAwesomeIcon icon={['fa-solid', 'fa-envelope']} className="text-teal-700 w-3.5" />
                    <span>{settings.email || 'halo@ckf.or.id'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
