import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getSettings, saveSettings } from '../../api/settings';
import { errMsg } from '../../api/client';
import { useSettings } from '../../context/SettingsContext';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

function ToggleSwitch({ label, description, checked, onChange, id }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:bg-slate-50">
      <div>
        <label htmlFor={id} className="cursor-pointer text-sm font-semibold text-slate-800">
          {label}
        </label>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-teal-700' : 'bg-slate-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function AboutContentAdmin() {
  const { data, loading, error } = useFetch(() => getSettings(), []);
  const { refetch: refetchGlobalSettings } = useSettings();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    if (data?.data) {
      setForm(data.data);
    }
  }, [data]);

  const handleChange = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleToggle = (key) => {
    setForm((prev) => {
      const current = prev[key] !== 'false';
      return { ...prev, [key]: current ? 'false' : 'true' };
    });
  };

  const isEnabled = (key) => form[key] !== 'false';

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
      setErrorText(errMsg(err, 'Gagal menyimpan konfigurasi konten Tentang Kami'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner label="Memuat konfigurasi konten Tentang Kami…" />;
  if (error) {
    return (
      <EmptyState
        icon="fa-triangle-exclamation"
        title="Gagal memuat pengaturan"
        description={errMsg(error)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">
          Manajemen Konten Halaman Tentang Kami
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola setiap bagian teks, visi misi, nilai pelayanan, susunan dewan pengurus, dan kendali visibilitas seksi halaman Tentang Kami.
        </p>
      </div>

      {errorText && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} />
          {errorText}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. KENDALI VISIBILITAS SEKSI */}
        <div className="card p-6 sm:p-8">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <FontAwesomeIcon icon={['fa-solid', 'fa-eye']} />
            </span>
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900">
                Visibilitas Seksi Halaman Tentang Kami
              </h2>
              <p className="text-xs text-slate-500">
                Aktifkan atau sembunyikan bagian-bagian tertentu di halaman Tentang Kami.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ToggleSwitch
              id="about_show_history"
              label="Seksi Latar Belakang & Sejarah"
              checked={isEnabled('about_show_history')}
              onChange={() => handleToggle('about_show_history')}
            />
            <ToggleSwitch
              id="about_show_vision"
              label="Seksi Visi, Misi & 4 Pilar"
              checked={isEnabled('about_show_vision')}
              onChange={() => handleToggle('about_show_vision')}
            />
            <ToggleSwitch
              id="about_show_values"
              label="Seksi Nilai-Nilai Pelayanan"
              checked={isEnabled('about_show_values')}
              onChange={() => handleToggle('about_show_values')}
            />
            <ToggleSwitch
              id="about_show_team"
              label="Seksi Susunan Dewan Pengurus"
              checked={isEnabled('about_show_team')}
              onChange={() => handleToggle('about_show_team')}
            />
            <ToggleSwitch
              id="about_show_partnership"
              label="Seksi Banner Kemitraan (CTA)"
              checked={isEnabled('about_show_partnership')}
              onChange={() => handleToggle('about_show_partnership')}
            />
          </div>
        </div>

        {/* 2. HEADER & PENGANTAR HALAMAN */}
        <div className="card p-6 sm:p-8">
          <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Header & Pengantar Halaman
          </h2>
          <div className="mt-4">
            <label htmlFor="about_header_subtitle" className="label">
              Subjudul Pengantar Header Halaman
            </label>
            <input
              id="about_header_subtitle"
              value={form.about_header_subtitle || ''}
              onChange={(e) => handleChange('about_header_subtitle', e.target.value)}
              className="input"
              placeholder="Mengenal komitmen, visi misi, serta struktur pengurus..."
            />
          </div>
        </div>

        {/* 3. SEJARAH & LATAR BELAKANG */}
        <div className="card p-6 sm:p-8">
          <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Seksi Latar Belakang & Sejarah
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="about_history_badge" className="label">Badge Seksi</label>
              <input
                id="about_history_badge"
                value={form.about_history_badge || ''}
                onChange={(e) => handleChange('about_history_badge', e.target.value)}
                className="input"
                placeholder="Latar Belakang"
              />
            </div>
            <div>
              <label htmlFor="about_history_title" className="label">Judul Seksi</label>
              <input
                id="about_history_title"
                value={form.about_history_title || ''}
                onChange={(e) => handleChange('about_history_title', e.target.value)}
                className="input"
                placeholder="Sejarah dan Komitmen Yayasan"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="about_history_p1" className="label">Paragraf 1 (Latar Belakang Berdirinya Yayasan)</label>
              <textarea
                id="about_history_p1"
                rows={3}
                value={form.about_history_p1 || ''}
                onChange={(e) => handleChange('about_history_p1', e.target.value)}
                className="input"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="about_history_p2" className="label">Paragraf 2 (Komitmen dan Tata Kelola Program)</label>
              <textarea
                id="about_history_p2"
                rows={3}
                value={form.about_history_p2 || ''}
                onChange={(e) => handleChange('about_history_p2', e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* 4. VISI, MISI, INTEGRITAS, INOVASI (4 PILAR) */}
        <div className="card p-6 sm:p-8">
          <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Seksi 4 Pilar Komitmen (Visi, Misi, Integritas, Inovasi)
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Pilar 1 (Visi)</span>
              <div>
                <label htmlFor="about_vision_title" className="label">Judul</label>
                <input
                  id="about_vision_title"
                  value={form.about_vision_title || ''}
                  onChange={(e) => handleChange('about_vision_title', e.target.value)}
                  className="input"
                  placeholder="Visi"
                />
              </div>
              <div>
                <label htmlFor="about_vision_desc" className="label">Deskripsi</label>
                <textarea
                  id="about_vision_desc"
                  rows={2}
                  value={form.about_vision_desc || ''}
                  onChange={(e) => handleChange('about_vision_desc', e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Pilar 2 (Misi)</span>
              <div>
                <label htmlFor="about_mission_title" className="label">Judul</label>
                <input
                  id="about_mission_title"
                  value={form.about_mission_title || ''}
                  onChange={(e) => handleChange('about_mission_title', e.target.value)}
                  className="input"
                  placeholder="Misi"
                />
              </div>
              <div>
                <label htmlFor="about_mission_desc" className="label">Deskripsi</label>
                <textarea
                  id="about_mission_desc"
                  rows={2}
                  value={form.about_mission_desc || ''}
                  onChange={(e) => handleChange('about_mission_desc', e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Pilar 3 (Integritas)</span>
              <div>
                <label htmlFor="about_integrity_title" className="label">Judul</label>
                <input
                  id="about_integrity_title"
                  value={form.about_integrity_title || ''}
                  onChange={(e) => handleChange('about_integrity_title', e.target.value)}
                  className="input"
                  placeholder="Integritas"
                />
              </div>
              <div>
                <label htmlFor="about_integrity_desc" className="label">Deskripsi</label>
                <textarea
                  id="about_integrity_desc"
                  rows={2}
                  value={form.about_integrity_desc || ''}
                  onChange={(e) => handleChange('about_integrity_desc', e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Pilar 4 (Inovasi)</span>
              <div>
                <label htmlFor="about_innovation_title" className="label">Judul</label>
                <input
                  id="about_innovation_title"
                  value={form.about_innovation_title || ''}
                  onChange={(e) => handleChange('about_innovation_title', e.target.value)}
                  className="input"
                  placeholder="Inovasi"
                />
              </div>
              <div>
                <label htmlFor="about_innovation_desc" className="label">Deskripsi</label>
                <textarea
                  id="about_innovation_desc"
                  rows={2}
                  value={form.about_innovation_desc || ''}
                  onChange={(e) => handleChange('about_innovation_desc', e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. NILAI-NILAI ORGANISASI */}
        <div className="card p-6 sm:p-8">
          <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Seksi Nilai-Nilai Organisasi (Prinsip Pelayanan)
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="about_values_badge" className="label">Badge Seksi</label>
              <input
                id="about_values_badge"
                value={form.about_values_badge || ''}
                onChange={(e) => handleChange('about_values_badge', e.target.value)}
                className="input"
                placeholder="Nilai Organisasi"
              />
            </div>
            <div>
              <label htmlFor="about_values_title" className="label">Judul Seksi</label>
              <input
                id="about_values_title"
                value={form.about_values_title || ''}
                onChange={(e) => handleChange('about_values_title', e.target.value)}
                className="input"
                placeholder="Prinsip Pelayanan Yayasan"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
              <span className="text-xs font-bold text-teal-800">Nilai 1</span>
              <div>
                <label htmlFor="about_val1_title" className="label">Judul</label>
                <input
                  id="about_val1_title"
                  value={form.about_val1_title || ''}
                  onChange={(e) => handleChange('about_val1_title', e.target.value)}
                  className="input"
                  placeholder="Akuntabilitas"
                />
              </div>
              <div>
                <label htmlFor="about_val1_desc" className="label">Deskripsi</label>
                <textarea
                  id="about_val1_desc"
                  rows={3}
                  value={form.about_val1_desc || ''}
                  onChange={(e) => handleChange('about_val1_desc', e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
              <span className="text-xs font-bold text-teal-800">Nilai 2</span>
              <div>
                <label htmlFor="about_val2_title" className="label">Judul</label>
                <input
                  id="about_val2_title"
                  value={form.about_val2_title || ''}
                  onChange={(e) => handleChange('about_val2_title', e.target.value)}
                  className="input"
                  placeholder="Kepedulian Sosial"
                />
              </div>
              <div>
                <label htmlFor="about_val2_desc" className="label">Deskripsi</label>
                <textarea
                  id="about_val2_desc"
                  rows={3}
                  value={form.about_val2_desc || ''}
                  onChange={(e) => handleChange('about_val2_desc', e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
              <span className="text-xs font-bold text-teal-800">Nilai 3</span>
              <div>
                <label htmlFor="about_val3_title" className="label">Judul</label>
                <input
                  id="about_val3_title"
                  value={form.about_val3_title || ''}
                  onChange={(e) => handleChange('about_val3_title', e.target.value)}
                  className="input"
                  placeholder="Kolaborasi Strategis"
                />
              </div>
              <div>
                <label htmlFor="about_val3_desc" className="label">Deskripsi</label>
                <textarea
                  id="about_val3_desc"
                  rows={3}
                  value={form.about_val3_desc || ''}
                  onChange={(e) => handleChange('about_val3_desc', e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
              <span className="text-xs font-bold text-teal-800">Nilai 4</span>
              <div>
                <label htmlFor="about_val4_title" className="label">Judul</label>
                <input
                  id="about_val4_title"
                  value={form.about_val4_title || ''}
                  onChange={(e) => handleChange('about_val4_title', e.target.value)}
                  className="input"
                  placeholder="Keberlanjutan"
                />
              </div>
              <div>
                <label htmlFor="about_val4_desc" className="label">Deskripsi</label>
                <textarea
                  id="about_val4_desc"
                  rows={3}
                  value={form.about_val4_desc || ''}
                  onChange={(e) => handleChange('about_val4_desc', e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 6. SUSUNAN DEWAN PENGURUS */}
        <div className="card p-6 sm:p-8">
          <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Seksi Struktur Organisasi & Pengurus
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="about_team_badge" className="label">Badge Seksi</label>
              <input
                id="about_team_badge"
                value={form.about_team_badge || ''}
                onChange={(e) => handleChange('about_team_badge', e.target.value)}
                className="input"
                placeholder="Struktur Organisasi"
              />
            </div>
            <div>
              <label htmlFor="about_team_title" className="label">Judul Seksi</label>
              <input
                id="about_team_title"
                value={form.about_team_title || ''}
                onChange={(e) => handleChange('about_team_title', e.target.value)}
                className="input"
                placeholder="Susunan Dewan Pengurus"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="about_team_list" className="label">
                Daftar Dewan Pengurus (Satu baris per orang, format: <code className="text-teal-700">Nama | Jabatan</code>)
              </label>
              <textarea
                id="about_team_list"
                rows={6}
                value={form.about_team_list || ''}
                onChange={(e) => handleChange('about_team_list', e.target.value)}
                className="input font-mono text-xs"
                placeholder="Hj. Kartika Sari | Ketua Yayasan&#10;Budi Santoso | Sekretaris&#10;Dra. Ratna Dewi | Bendahara..."
              />
            </div>
          </div>
        </div>

        {/* 7. BANNER KEMITRAAN */}
        <div className="card p-6 sm:p-8">
          <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Seksi Banner Kemitraan & Partisipasi Program
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="about_cta_title" className="label">Judul Banner Kemitraan</label>
              <input
                id="about_cta_title"
                value={form.about_cta_title || ''}
                onChange={(e) => handleChange('about_cta_title', e.target.value)}
                className="input"
                placeholder="Kemitraan dan Partisipasi Program"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="about_cta_desc" className="label">Deskripsi Ajakan Kemitraan</label>
              <textarea
                id="about_cta_desc"
                rows={2}
                value={form.about_cta_desc || ''}
                onChange={(e) => handleChange('about_cta_desc', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="about_cta_btn_text" className="label">Teks Tombol</label>
              <input
                id="about_cta_btn_text"
                value={form.about_cta_btn_text || ''}
                onChange={(e) => handleChange('about_cta_btn_text', e.target.value)}
                className="input"
                placeholder="Hubungi Sekretariat"
              />
            </div>
            <div>
              <label htmlFor="about_cta_btn_link" className="label">Tautan Tombol</label>
              <input
                id="about_cta_btn_link"
                value={form.about_cta_btn_link || ''}
                onChange={(e) => handleChange('about_cta_btn_link', e.target.value)}
                className="input"
                placeholder="/kontak"
              />
            </div>
          </div>
        </div>

        {/* STICKY SAVE BAR */}
        <div className="card sticky bottom-6 z-10 flex items-center justify-between p-4 shadow-lg border border-slate-200/80 bg-white/95 backdrop-blur">
          <p className="text-xs text-slate-500 hidden sm:block">
            Perubahan konten Tentang Kami akan langsung diterapkan pada halaman publik.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {saved && (
              <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <FontAwesomeIcon icon={['fa-solid', 'fa-circle-check']} />
                Konten Tentang Kami tersimpan
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="btn-primary !px-6 !py-2.5 shadow-md w-full sm:w-auto"
            >
              {saving ? 'Menyimpan…' : 'Simpan Konten'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
