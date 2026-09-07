import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getSettings, saveSettings } from '../../api/settings';
import { useSettings } from '../../context/SettingsContext';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const GROUPS = [
  {
    title: 'Identitas Lembaga',
    fields: [
      { key: 'foundation_name', label: 'Nama Lembaga' },
      { key: 'tagline', label: 'Slogan / Tagline' },
      { key: 'about_text', label: 'Deskripsi Singkat', textarea: true },
    ],
  },
  {
    title: 'Kontak & Alamat',
    fields: [
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Telepon / WhatsApp' },
      { key: 'address', label: 'Alamat Kantor' },
    ],
  },
  {
    title: 'Media Sosial',
    fields: [
      { key: 'social_facebook', label: 'Facebook' },
      { key: 'social_instagram', label: 'Instagram' },
      { key: 'social_youtube', label: 'YouTube' },
      { key: 'social_x', label: 'X (Twitter)' },
    ],
  },
  {
    title: 'Angka Statistik',
    fields: [
      { key: 'stat_beneficiaries', label: 'Penerima Manfaat' },
      { key: 'stat_programs', label: 'Program Terlaksana' },
      { key: 'stat_volunteers', label: 'Relawan Terlibat' },
      { key: 'stat_years', label: 'Tahun Pengalaman' },
    ],
  },
  {
    title: 'Rekening Donasi',
    fields: [
      { key: 'donation_bank_name', label: 'Nama Bank' },
      { key: 'donation_account_number', label: 'Nomor Rekening & Atas Nama' },
    ],
  },
];

export default function SettingsAdmin() {
  const { data, loading, error } = useFetch(() => getSettings(), []);
  const { refetch: refetchGlobalSettings } = useSettings();
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
      if (refetchGlobalSettings) await refetchGlobalSettings();
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
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
            Pengaturan Umum
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola informasi lembaga, kontak, dan rekening donasi.
          </p>
        </div>
      </div>

      {errorText && (
        <p className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-700">
          <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} />
          {errorText}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          {GROUPS.map((group, idx) => (
            <div
              key={group.title}
              className={`admin-card p-6 sm:p-7 ${idx === 0 ? 'xl:col-span-2' : ''}`}
            >
              <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                {group.title}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {group.fields.map((f) => (
                  <div key={f.key} className={f.textarea ? 'sm:col-span-2' : ''}>
                    <label htmlFor={f.key} className="label text-xs">{f.label}</label>
                    {f.textarea ? (
                      <textarea
                        id={f.key}
                        rows={3}
                        value={form[f.key] || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        className="input text-xs leading-relaxed"
                      />
                    ) : (
                      <input
                        id={f.key}
                        value={form[f.key] || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        className="input text-xs"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sticky Action Save Bar */}
        <div className="admin-card sticky bottom-6 z-10 flex items-center justify-between p-4 shadow-lg border border-slate-200/80 bg-white/95 backdrop-blur">
          <p className="text-xs text-slate-500 hidden sm:block">
            Perubahan akan langsung tampil di website.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {saved && (
              <span className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <FontAwesomeIcon icon={['fa-solid', 'fa-circle-check']} />
                Tersimpan
              </span>
            )}
            <button type="submit" disabled={saving} className="admin-btn-primary !px-6 !py-2.5 text-xs font-bold shadow-md w-full sm:w-auto">
              {saving ? 'Menyimpan…' : 'Simpan Pengaturan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
