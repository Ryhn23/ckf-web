import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getSettings, saveSettings } from '../../api/settings';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const GROUPS = [
  {
    title: 'Identitas Yayasan',
    fields: [
      { key: 'foundation_name', label: 'Nama Yayasan' },
      { key: 'tagline', label: 'Tagline' },
      { key: 'about_text', label: 'Tentang Kami (teks beranda)', textarea: true },
    ],
  },
  {
    title: 'Kontak',
    fields: [
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Telepon' },
      { key: 'address', label: 'Alamat' },
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
    title: 'Statistik Beranda',
    fields: [
      { key: 'stat_beneficiaries', label: 'Penerima Manfaat' },
      { key: 'stat_programs', label: 'Program' },
      { key: 'stat_volunteers', label: 'Relawan' },
      { key: 'stat_years', label: 'Tahun Berdiri' },
    ],
  },
  {
    title: 'Donasi',
    fields: [
      { key: 'donation_bank_name', label: 'Nama Bank' },
      { key: 'donation_account_number', label: 'Nomor Rekening' },
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
        <h1 className="font-heading text-2xl font-bold text-slate-900">Pengaturan</h1>
        <p className="mt-1 text-sm text-slate-500">Kelola informasi situs yang tampil di halaman publik.</p>
      </div>

      {errorText && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} />
          {errorText}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {GROUPS.map((group) => (
          <div key={group.title} className="card p-6">
            <h2 className="font-heading text-base font-bold text-slate-900">{group.title}</h2>
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

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Menyimpan…' : 'Simpan Pengaturan'}
          </button>
          {saved && (
            <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
              <FontAwesomeIcon icon={['fa-solid', 'fa-circle-check']} />
              Pengaturan tersimpan
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
