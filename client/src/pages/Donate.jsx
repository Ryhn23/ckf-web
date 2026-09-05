import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { createDonation } from '../api/donations';
import { getCategories } from '../api/categories';
import useFetch from '../hooks/useFetch';
import PageHeader from '../components/layout/PageHeader';
import { useSettings } from '../context/SettingsContext';
import Seo from '../components/Seo';

const PRESETS = [50_000, 100_000, 200_000, 500_000];

function formatRupiah(n) {
  return `Rp ${Number(n).toLocaleString('id-ID')}`;
}

export default function Donate() {
  const { data: catData } = useFetch(() => getCategories(), []);
  const categories = catData?.data || [];
  const { settings } = useSettings();

  const [form, setForm] = useState({ amount: '100000', name: '', email: '', phone: '', programId: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const amount = Number(form.amount);
    if (!form.name.trim() || !amount) {
      setError('Mohon lengkapi nama dan nominal donasi.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await createDonation({
        name: form.name,
        email: form.email,
        phone: form.phone,
        amount,
        programId: form.programId || null,
        message: form.message,
      });
      setSuccess(res.data);
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.message || 'Gagal mengirim donasi. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <>
        <PageHeader title="Donasi" crumbs={[{ label: 'Donasi' }]} />
        <section className="container-page max-w-2xl py-16">
          <div className="card p-8 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-2xl text-teal-700">
              <FontAwesomeIcon icon={['fa-solid', 'fa-check']} />
            </span>
            <h2 className="mt-5 font-heading text-2xl font-bold text-slate-900">Terima Kasih, {success.name}!</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Niat baik Anda senilai <strong>{formatRupiah(success.amount)}</strong> telah kami catat
              (No. <span className="font-mono">{success.reference}</span>). Tim kami akan menghubungi
              Anda melalui email/telepon untuk informasi transfer dan penyaluran donasi.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link to="/" className="btn-outline">Kembali ke Beranda</Link>
              <button type="button" onClick={() => setSuccess(null)} className="btn-primary">
                Donasi Lagi
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Seo title="Donasi" description="Salurkan kebaikan Anda. Setiap donasi dilaporkan secara transparan dan disalurkan tepat sasaran." />
      <PageHeader
        title="Donasi"
        subtitle="Salurkan kebaikan Anda. Setiap donasi dilaporkan secara transparan dan disalurkan tepat sasaran."
        crumbs={[{ label: 'Donasi' }]}
      />

      <section className="container-page grid gap-8 py-12 lg:grid-cols-5 lg:py-16">
        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 lg:col-span-3 md:p-8">
          <h2 className="font-heading text-xl font-bold text-slate-900">Form Donasi</h2>

          <label className="mt-6 block text-sm font-semibold text-slate-700" htmlFor="amount">
            Nominal Donasi
          </label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm((f) => ({ ...f, amount: String(p) }))}
                className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition ${
                  form.amount === String(p)
                    ? 'border-teal-700 bg-teal-700 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
                }`}
              >
                {formatRupiah(p).replace('Rp ', 'Rp')}
              </button>
            ))}
          </div>
          <input
            id="amount"
            type="number"
            min="1000"
            value={form.amount}
            onChange={set('amount')}
            className="input mt-2"
            placeholder="Atau masukkan nominal lain"
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="text-sm font-semibold text-slate-700">Nama Lengkap *</label>
              <input id="name" value={form.name} onChange={set('name')} required className="input mt-1.5" placeholder="Nama Anda" />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</label>
              <input id="email" type="email" value={form.email} onChange={set('email')} className="input mt-1.5" placeholder="email@contoh.com" />
            </div>
            <div>
              <label htmlFor="phone" className="text-sm font-semibold text-slate-700">No. Telepon</label>
              <input id="phone" value={form.phone} onChange={set('phone')} className="input mt-1.5" placeholder="08xxxxxxxxxx" />
            </div>
            <div>
              <label htmlFor="programId" className="text-sm font-semibold text-slate-700">Program (opsional)</label>
              <select id="programId" value={form.programId} onChange={set('programId')} className="input mt-1.5">
                <option value="">Penyaluran sesuai kebutuhan</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="message" className="text-sm font-semibold text-slate-700">Pesan / Doa (opsional)</label>
            <textarea id="message" rows={3} value={form.message} onChange={set('message')} className="input mt-1.5" placeholder="Tuliskan pesan atau doa untuk penerima manfaat…" />
          </div>

          {error && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} />
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-accent mt-6 w-full justify-center disabled:opacity-60">
            {submitting ? 'Mengirim…' : 'Kirim Niat Donasi'}
          </button>
          <p className="mt-3 text-center text-xs text-slate-400">
            Donasi Anda akan diverifikasi dan dikonfirmasi oleh tim kami sebelum penyaluran.
          </p>
        </form>

        {/* Info samping */}
        <aside className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <h3 className="font-heading text-lg font-bold text-slate-900">Mengapa Donasi ke CKF?</h3>
            <ul className="mt-4 space-y-3">
              {[
                'Laporan penggunaan dana dipublikasikan rutin',
                'Donasi dapat ditunjuk untuk program tertentu',
                'Konfirmasi & bukti penyaluran dikirim ke donatur',
                'Relawan lokal memastikan bantuan sampai tepat sasaran',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] text-teal-700">
                    <FontAwesomeIcon icon={['fa-solid', 'fa-check']} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="card bg-gradient-to-br from-teal-700 to-teal-900 p-6 text-white">
            <h3 className="font-heading text-lg font-bold">Rekening Donasi</h3>
            <p className="mt-3 text-sm text-teal-100">{settings.donation_bank_name || 'Bank Amanah'}</p>
            <p className="mt-2 font-mono text-xl font-bold tracking-wider text-amber-300">
              {settings.donation_account_number || '1234-5678-9010'}
            </p>
            <p className="mt-4 text-xs leading-relaxed text-teal-200">
              Setelah transfer, mohon isi form di samping agar donasi Anda dapat kami catat dan
              dilaporkan.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
