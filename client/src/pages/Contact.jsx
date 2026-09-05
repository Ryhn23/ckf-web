import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { createContactMessage } from '../api/contact';
import PageHeader from '../components/layout/PageHeader';
import { useSettings } from '../context/SettingsContext';
import Seo from '../components/Seo';

export default function Contact() {
  const { settings } = useSettings();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createContactMessage(form);
      setSuccess(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(err.message || 'Gagal mengirim pesan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Seo title="Kontak" description="Punya pertanyaan, ingin berdonasi, atau bergabung sebagai relawan? Sampaikan pesan Anda." />
      <PageHeader
        title="Hubungi Kami"
        subtitle="Punya pertanyaan, ingin berdonasi, atau bergabung sebagai relawan? Sampaikan pesan Anda."
        crumbs={[{ label: 'Kontak' }]}
      />

      <section className="container-page grid gap-8 py-12 lg:grid-cols-5 lg:py-16">
        {/* Info */}
        <div className="space-y-6 lg:col-span-2">
          {[
            { icon: ['fa-solid', 'fa-location-dot'], title: 'Alamat', lines: settings.address ? [settings.address] : ['Jl. Kebajikan No. 17, Kel. Sukamaju', 'Kec. Harapanjaya, Indonesia 12345'] },
            { icon: ['fa-solid', 'fa-phone'], title: 'Telepon / WhatsApp', lines: [settings.phone || '+62 812-3456-7890', 'Senin–Sabtu, 08.00–17.00 WIB'] },
            { icon: ['fa-solid', 'fa-envelope'], title: 'Email', lines: settings.email ? [settings.email] : ['halo@ckf.or.id', 'donasi@ckf.or.id'] },
          ].map((item) => (
            <div key={item.title} className="card flex items-start gap-4 p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-lg text-teal-700">
                <FontAwesomeIcon icon={item.icon} />
              </span>
              <div>
                <h3 className="font-heading font-bold text-slate-900">{item.title}</h3>
                {item.lines.map((line) => (
                  <p key={line} className="mt-1 text-sm text-slate-500">{line}</p>
                ))}
              </div>
            </div>
          ))}

          <div className="card bg-gradient-to-br from-teal-700 to-teal-900 p-6 text-white">
            <h3 className="font-heading text-lg font-bold">Kantor Yayasan</h3>
            <p className="mt-2 text-sm leading-relaxed text-teal-100">
              Kami menerima kunjungan dengan perjanjian terlebih dahulu. Silakan hubungi via
              WhatsApp untuk menjadwalkan.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 lg:col-span-3 md:p-8">
          {success ? (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-2xl text-teal-700">
                <FontAwesomeIcon icon={['fa-solid', 'fa-check']} />
              </span>
              <h2 className="mt-5 font-heading text-2xl font-bold text-slate-900">Pesan Terkirim!</h2>
              <p className="mt-3 max-w-sm text-sm text-slate-600">
                Terima kasih. Tim kami akan membalas pesan Anda secepat mungkin.
              </p>
              <button type="button" onClick={() => setSuccess(false)} className="btn-outline mt-6">
                Kirim Pesan Lain
              </button>
            </div>
          ) : (
            <>
              <h2 className="font-heading text-xl font-bold text-slate-900">Kirim Pesan</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className="text-sm font-semibold text-slate-700">Nama *</label>
                  <input id="c-name" value={form.name} onChange={set('name')} required className="input mt-1.5" placeholder="Nama Anda" />
                </div>
                <div>
                  <label htmlFor="c-email" className="text-sm font-semibold text-slate-700">Email *</label>
                  <input id="c-email" type="email" value={form.email} onChange={set('email')} required className="input mt-1.5" placeholder="email@contoh.com" />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="c-subject" className="text-sm font-semibold text-slate-700">Perihal</label>
                <select id="c-subject" value={form.subject} onChange={set('subject')} className="input mt-1.5">
                  <option value="">— Pilih perihal —</option>
                  <option>Informasi Donasi</option>
                  <option>Pendaftaran Relawan</option>
                  <option>Kemitraan Program</option>
                  <option>Lainnya</option>
                </select>
              </div>
              <div className="mt-4">
                <label htmlFor="c-message" className="text-sm font-semibold text-slate-700">Pesan *</label>
                <textarea id="c-message" rows={5} value={form.message} onChange={set('message')} required className="input mt-1.5" placeholder="Tuliskan pesan Anda…" />
              </div>

              {error && (
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} />
                  {error}
                </p>
              )}

              <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full justify-center disabled:opacity-60">
                {submitting ? 'Mengirim…' : 'Kirim Pesan'}
              </button>
            </>
          )}
        </form>
      </section>
    </>
  );
}
