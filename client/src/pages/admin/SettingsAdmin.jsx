import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getSettings, saveSettings } from '../../api/settings';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const GROUPS = [
  {
    title: 'Identitas & Profil Yayasan',
    fields: [
      { key: 'foundation_name', label: 'Nama Resmi Yayasan' },
      { key: 'tagline', label: 'Motto / Semboyan Lembaga' },
      { key: 'about_text', label: 'Deskripsi Profil Lembaga (Halaman Beranda)', textarea: true },
    ],
  },
  {
    title: 'Sekretariat & Kontak Resmi',
    fields: [
      { key: 'email', label: 'Alamat Email Resmi' },
      { key: 'phone', label: 'Nomor Telepon / WhatsApp Layanan' },
      { key: 'address', label: 'Alamat Lengkap Kantor Sekretariat' },
    ],
  },
  {
    title: 'Kanal Media Sosial Resmi',
    fields: [
      { key: 'social_facebook', label: 'Tautan Facebook' },
      { key: 'social_instagram', label: 'Tautan Instagram' },
      { key: 'social_youtube', label: 'Tautan YouTube' },
      { key: 'social_x', label: 'Tautan X (Twitter)' },
    ],
  },
  {
    title: 'Indikator Kinerja & Capaian (Statistik)',
    fields: [
      { key: 'stat_beneficiaries', label: 'Total Penerima Manfaat' },
      { key: 'stat_programs', label: 'Total Program Terlaksana' },
      { key: 'stat_volunteers', label: 'Total Relawan Terlibat' },
      { key: 'stat_years', label: 'Masa Berkhidmat (Tahun)' },
    ],
  },
  {
    title: 'Rekening Perbendaharaan Donasi',
    fields: [
      { key: 'donation_bank_name', label: 'Nama Bank Penerima' },
      { key: 'donation_account_number', label: 'Nomor Rekening & Atas Nama' },
    ],
  },
];

export default function SettingsAdmin() {
  const { data, loading, error } = useFetch(() => getSettings(), []);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    if (data?.data) setForm(data.data);
  }, [data]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorText('');
    setSaving(true);
    try {
      await saveSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setErrorText(errMsg(err, 'Gagal menyimpan pengaturan'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner label="Memuat pengaturan…" />;
  if (error) return <EmptyState icon="fa-triangle-exclamation" title="Gagal memuat pengaturan" description={errMsg(error)} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Konfigurasi Pengaturan Sistem</h1>
        <p className="mt-1 text-sm text-slate-500">Kelola informasi kelembagaan, kontak sekretariat, dan parameter yang ditampilkan pada situs publik.</p>
      </div>

      {errorText && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} />
          {errorText}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          {GROUPS.map((group, idx) => (
            <div
              key={group.title}
              className={`card p-6 sm:p-8 ${idx === 0 ? 'xl:col-span-2' : ''}`}
            >
              <h2 className="font-heading text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                {group.title}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {group.fields.map((f) => (
                  <div key={f.key} className={f.textarea ? 'sm:col-span-2' : ''}>
                    <label htmlFor={f.key} className="label">{f.label}</label>
                    {f.textarea ? (
                      <textarea
                        id={f.key}
                        rows={4}
                        value={form[f.key] || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        className="input"
                      />
                    ) : (
                      <input
                        id={f.key}
                        value={form[f.key] || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        className="input"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="card sticky bottom-6 z-10 flex items-center justify-between p-4 shadow-lg border border-slate-200/80 bg-white/95 backdrop-blur">
          <p className="text-xs text-slate-500 hidden sm:block">
            Pastikan memeriksa kembali perubahan data sebelum menyimpan.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {saved && (
              <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <FontAwesomeIcon icon={['fa-solid', 'fa-circle-check']} />
                Pengaturan tersimpan
              </span>
            )}
            <button type="submit" disabled={saving} className="btn-primary !px-6 !py-2.5 shadow-md w-full sm:w-auto">
              {saving ? 'Menyimpan…' : 'Simpan Pengaturan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
