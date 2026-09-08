import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getSettings, saveSettings } from '../../api/settings';
import { errMsg } from '../../api/client';
import { useSettings } from '../../context/SettingsContext';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ImageUploadField from '../../components/admin/ImageUploadField';

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

export default function HomeContentAdmin() {
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
      setErrorText(errMsg(err, 'Gagal menyimpan konfigurasi konten beranda'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner label="Memuat konfigurasi konten beranda…" />;
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
          Konten Beranda
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Atur teks, banner, dan tampilan bagian halaman beranda.
        </p>
      </div>

      {errorText && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <FontAwesomeIcon icon={['fa-solid', 'fa-circle-exclamation']} />
          {errorText}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. KENDALI VISIBILITAS MENU PUBLIK */}
        <div className="admin-card p-6 sm:p-8">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-heading text-base font-bold text-slate-900">
              Visibilitas Menu Navigasi
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Tampilkan atau sembunyikan menu di navbar dan footer.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ToggleSwitch
              id="menu_donasi_enabled"
              label="Menu & Halaman Donasi"
              description="Menampilkan tautan & tombol aksi donasi"
              checked={isEnabled('menu_donasi_enabled')}
              onChange={() => handleToggle('menu_donasi_enabled')}
            />
            <ToggleSwitch
              id="menu_program_enabled"
              label="Menu Program"
              description="Menampilkan tautan katalog program kerja"
              checked={isEnabled('menu_program_enabled')}
              onChange={() => handleToggle('menu_program_enabled')}
            />
            <ToggleSwitch
              id="menu_blog_enabled"
              label="Menu Artikel / Berita"
              description="Menampilkan publikasi cerita & rilis"
              checked={isEnabled('menu_blog_enabled')}
              onChange={() => handleToggle('menu_blog_enabled')}
            />
            <ToggleSwitch
              id="menu_galeri_enabled"
              label="Menu Galeri"
              description="Menampilkan dokumentasi visual aktivitas"
              checked={isEnabled('menu_galeri_enabled')}
              onChange={() => handleToggle('menu_galeri_enabled')}
            />
            <ToggleSwitch
              id="menu_kontak_enabled"
              label="Menu Kontak"
              description="Menampilkan formulir & kontak sekretariat"
              checked={isEnabled('menu_kontak_enabled')}
              onChange={() => handleToggle('menu_kontak_enabled')}
            />
            <ToggleSwitch
              id="menu_tentang_enabled"
              label="Menu Tentang Kami"
              description="Menampilkan profil dan sejarah lembaga"
              checked={isEnabled('menu_tentang_enabled')}
              onChange={() => handleToggle('menu_tentang_enabled')}
            />
            <ToggleSwitch
              id="menu_bantuan_enabled"
              label="Penerimaan Permohonan Bantuan"
              description="Buka atau tutup penerimaan pengajuan bantuan pada tautan khusus portal"
              checked={isEnabled('menu_bantuan_enabled')}
              onChange={() => handleToggle('menu_bantuan_enabled')}
            />
          </div>
        </div>

        {/* 2. KENDALI VISIBILITAS SEKSI BERANDA */}
        <div className="admin-card p-6 sm:p-8">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-heading text-base font-bold text-slate-900">
              Visibilitas Seksi Halaman Utama (Beranda)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Pengaturan aktif atau nonaktif seksi-seksi konten pada halaman muka website.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ToggleSwitch
              id="home_show_hero"
              label="Seksi Hero Banner"
              checked={isEnabled('home_show_hero')}
              onChange={() => handleToggle('home_show_hero')}
            />
            <ToggleSwitch
              id="home_show_stats"
              label="Seksi Statistik Capaian"
              checked={isEnabled('home_show_stats')}
              onChange={() => handleToggle('home_show_stats')}
            />
            <ToggleSwitch
              id="home_show_about"
              label="Seksi Profil Lembaga"
              checked={isEnabled('home_show_about')}
              onChange={() => handleToggle('home_show_about')}
            />
            <ToggleSwitch
              id="home_show_programs"
              label="Seksi Fokus Program"
              checked={isEnabled('home_show_programs')}
              onChange={() => handleToggle('home_show_programs')}
            />
            <ToggleSwitch
              id="home_show_posts"
              label="Seksi Artikel Terbaru"
              checked={isEnabled('home_show_posts')}
              onChange={() => handleToggle('home_show_posts')}
            />
            <ToggleSwitch
              id="home_show_testimonials"
              label="Seksi Testimoni"
              checked={isEnabled('home_show_testimonials')}
              onChange={() => handleToggle('home_show_testimonials')}
            />
            <ToggleSwitch
              id="home_show_partners"
              label="Seksi Mitra & Donatur"
              checked={isEnabled('home_show_partners')}
              onChange={() => handleToggle('home_show_partners')}
            />
            <ToggleSwitch
              id="home_show_cta"
              label="Seksi Ajakan Donasi (CTA)"
              checked={isEnabled('home_show_cta')}
              onChange={() => handleToggle('home_show_cta')}
            />
          </div>
        </div>

        {/* 3. HERO BANNER UTAMA */}
        <div className="admin-card p-6 sm:p-8">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-heading text-base font-bold text-slate-900">
              Seksi Hero Banner &amp; Carousel Beranda
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Pengaturan mode tampilan banner utama, pemilihan sumber konten, serta konfigurasi slide gambar carousel beranda.
            </p>
          </div>

          <div className="mt-5 space-y-6">
            <div>
              <label className="label">Mode Sumber Tampilan Hero Banner</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  (form.hero_mode || 'featured') === 'featured' ? 'border-teal-700 bg-teal-50/50' : 'border-slate-200 bg-white'
                }`}>
                  <input
                    type="radio"
                    name="hero_mode"
                    value="featured"
                    checked={(form.hero_mode || 'featured') === 'featured'}
                    onChange={() => handleChange('hero_mode', 'featured')}
                    className="mt-1 accent-teal-700"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-900">Otomatis dari Artikel Unggulan (Featured)</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Menampilkan artikel publikasi yang ditandai 'Sematan Beranda Utama' secara dinamis.
                    </p>
                  </div>
                </label>

                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  form.hero_mode === 'custom' ? 'border-teal-700 bg-teal-50/50' : 'border-slate-200 bg-white'
                }`}>
                  <input
                    type="radio"
                    name="hero_mode"
                    value="custom"
                    checked={form.hero_mode === 'custom'}
                    onChange={() => handleChange('hero_mode', 'custom')}
                    className="mt-1 accent-teal-700"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-900">Slide Carousel Kustom</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Menampilkan gambar banner promosi kustom dengan teks dan tombol yang dikonfigurasi di bawah ini.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Konfigurasi Slide 1 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900">Slide 1 (Banner Utama)</h3>
                <span className="rounded bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-800">Slide Utama</span>
              </div>

              <ImageUploadField
                id="hero_slide_1_image"
                label="Gambar Sampul Slide 1"
                description="Disarankan rasio 16:9 atau panorama beresolusi minimal 1600x900px."
                value={form.hero_slide_1_image || ''}
                onChange={(val) => handleChange('hero_slide_1_image', val)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="hero_slide_1_badge" className="label">Label Kategori / Badge</label>
                  <input
                    id="hero_slide_1_badge"
                    value={form.hero_slide_1_badge || ''}
                    onChange={(e) => handleChange('hero_slide_1_badge', e.target.value)}
                    className="input text-sm"
                    placeholder="Contoh: Program Unggulan"
                  />
                </div>
                <div>
                  <label htmlFor="hero_title" className="label">Judul Utama Banner</label>
                  <input
                    id="hero_title"
                    value={form.hero_title || ''}
                    onChange={(e) => {
                      handleChange('hero_title', e.target.value);
                      handleChange('hero_slide_1_title', e.target.value);
                    }}
                    className="input text-sm"
                    placeholder="Mewujudkan Kemandirian dan Kesejahteraan Masyarakat"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="hero_excerpt" className="label">Deskripsi Singkat Slide</label>
                  <textarea
                    id="hero_excerpt"
                    rows={2}
                    value={form.hero_excerpt || ''}
                    onChange={(e) => {
                      handleChange('hero_excerpt', e.target.value);
                      handleChange('hero_slide_1_subtitle', e.target.value);
                    }}
                    className="input text-sm"
                    placeholder="Uraian singkat misi lembaga..."
                  />
                </div>
                <div>
                  <label htmlFor="hero_btn_primary_text" className="label">Teks Tombol Utama</label>
                  <input
                    id="hero_btn_primary_text"
                    value={form.hero_btn_primary_text || ''}
                    onChange={(e) => handleChange('hero_btn_primary_text', e.target.value)}
                    className="input text-sm"
                    placeholder="Profil Lembaga"
                  />
                </div>
                <div>
                  <label htmlFor="hero_btn_primary_link" className="label">Tautan Tombol Utama</label>
                  <input
                    id="hero_btn_primary_link"
                    value={form.hero_btn_primary_link || ''}
                    onChange={(e) => handleChange('hero_btn_primary_link', e.target.value)}
                    className="input text-sm"
                    placeholder="/tentang"
                  />
                </div>
                <div>
                  <label htmlFor="hero_btn_secondary_text" className="label">Teks Tombol Donasi</label>
                  <input
                    id="hero_btn_secondary_text"
                    value={form.hero_btn_secondary_text || ''}
                    onChange={(e) => handleChange('hero_btn_secondary_text', e.target.value)}
                    className="input text-sm"
                    placeholder="Donasi Sekarang"
                  />
                </div>
                <div>
                  <label htmlFor="hero_btn_secondary_link" className="label">Tautan Tombol Donasi</label>
                  <input
                    id="hero_btn_secondary_link"
                    value={form.hero_btn_secondary_link || ''}
                    onChange={(e) => handleChange('hero_btn_secondary_link', e.target.value)}
                    className="input text-sm"
                    placeholder="/donasi"
                  />
                </div>
              </div>
            </div>

            {/* Konfigurasi Slide 2 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900">Slide 2 (Opsional)</h3>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Slide Tambahan</span>
              </div>

              <ImageUploadField
                id="hero_slide_2_image"
                label="Gambar Sampul Slide 2"
                description="Unggah gambar sampul jika ingin mengaktifkan slide kedua."
                value={form.hero_slide_2_image || ''}
                onChange={(val) => handleChange('hero_slide_2_image', val)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="hero_slide_2_badge" className="label">Label Kategori / Badge</label>
                  <input
                    id="hero_slide_2_badge"
                    value={form.hero_slide_2_badge || ''}
                    onChange={(e) => handleChange('hero_slide_2_badge', e.target.value)}
                    className="input text-sm"
                    placeholder="Contoh: Layanan Kesehatan"
                  />
                </div>
                <div>
                  <label htmlFor="hero_slide_2_title" className="label">Judul Banner Slide 2</label>
                  <input
                    id="hero_slide_2_title"
                    value={form.hero_slide_2_title || ''}
                    onChange={(e) => handleChange('hero_slide_2_title', e.target.value)}
                    className="input text-sm"
                    placeholder="Pelayanan Medis dan Pos Gizi Balita Dhuafa"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="hero_slide_2_subtitle" className="label">Deskripsi Singkat Slide 2</label>
                  <textarea
                    id="hero_slide_2_subtitle"
                    rows={2}
                    value={form.hero_slide_2_subtitle || ''}
                    onChange={(e) => handleChange('hero_slide_2_subtitle', e.target.value)}
                    className="input text-sm"
                    placeholder="Uraian kegiatan atau ajakan partisipasi..."
                  />
                </div>
                <div>
                  <label htmlFor="hero_slide_2_btn_text" className="label">Teks Tombol Aksi</label>
                  <input
                    id="hero_slide_2_btn_text"
                    value={form.hero_slide_2_btn_text || ''}
                    onChange={(e) => handleChange('hero_slide_2_btn_text', e.target.value)}
                    className="input text-sm"
                    placeholder="Lihat Program"
                  />
                </div>
                <div>
                  <label htmlFor="hero_slide_2_btn_link" className="label">Tautan Tombol Aksi</label>
                  <input
                    id="hero_slide_2_btn_link"
                    value={form.hero_slide_2_btn_link || ''}
                    onChange={(e) => handleChange('hero_slide_2_btn_link', e.target.value)}
                    className="input text-sm"
                    placeholder="/program"
                  />
                </div>
              </div>
            </div>

            {/* Konfigurasi Slide 3 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900">Slide 3 (Opsional)</h3>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Slide Tambahan</span>
              </div>

              <ImageUploadField
                id="hero_slide_3_image"
                label="Gambar Sampul Slide 3"
                description="Unggah gambar sampul jika ingin mengaktifkan slide ketiga."
                value={form.hero_slide_3_image || ''}
                onChange={(val) => handleChange('hero_slide_3_image', val)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="hero_slide_3_badge" className="label">Label Kategori / Badge</label>
                  <input
                    id="hero_slide_3_badge"
                    value={form.hero_slide_3_badge || ''}
                    onChange={(e) => handleChange('hero_slide_3_badge', e.target.value)}
                    className="input text-sm"
                    placeholder="Contoh: Beasiswa Prestasi"
                  />
                </div>
                <div>
                  <label htmlFor="hero_slide_3_title" className="label">Judul Banner Slide 3</label>
                  <input
                    id="hero_slide_3_title"
                    value={form.hero_slide_3_title || ''}
                    onChange={(e) => handleChange('hero_slide_3_title', e.target.value)}
                    className="input text-sm"
                    placeholder="Mendukung Generasi Penerus Meraih Cita-Cita"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="hero_slide_3_subtitle" className="label">Deskripsi Singkat Slide 3</label>
                  <textarea
                    id="hero_slide_3_subtitle"
                    rows={2}
                    value={form.hero_slide_3_subtitle || ''}
                    onChange={(e) => handleChange('hero_slide_3_subtitle', e.target.value)}
                    className="input text-sm"
                    placeholder="Uraian program beasiswa..."
                  />
                </div>
                <div>
                  <label htmlFor="hero_slide_3_btn_text" className="label">Teks Tombol Aksi</label>
                  <input
                    id="hero_slide_3_btn_text"
                    value={form.hero_slide_3_btn_text || ''}
                    onChange={(e) => handleChange('hero_slide_3_btn_text', e.target.value)}
                    className="input text-sm"
                    placeholder="Donasi Sekarang"
                  />
                </div>
                <div>
                  <label htmlFor="hero_slide_3_btn_link" className="label">Tautan Tombol Aksi</label>
                  <input
                    id="hero_slide_3_btn_link"
                    value={form.hero_slide_3_btn_link || ''}
                    onChange={(e) => handleChange('hero_slide_3_btn_link', e.target.value)}
                    className="input text-sm"
                    placeholder="/donasi"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. INDIKATOR CAPAIAN (STATISTIK) */}
        <div className="admin-card p-6 sm:p-8">
          <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Seksi Indikator Capaian (Statistik Counter)
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Sesuaikan label teks dan target angka indikator capaian.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Indikator 1</span>
              <div>
                <label htmlFor="stat_programs_label" className="label">Label</label>
                <input
                  id="stat_programs_label"
                  value={form.stat_programs_label || ''}
                  onChange={(e) => handleChange('stat_programs_label', e.target.value)}
                  className="input"
                  placeholder="Program Dikerjakan"
                />
              </div>
              <div>
                <label htmlFor="stat_programs" className="label">Target Angka</label>
                <input
                  id="stat_programs"
                  type="number"
                  value={form.stat_programs || ''}
                  onChange={(e) => handleChange('stat_programs', e.target.value)}
                  className="input"
                  placeholder="350"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Indikator 2</span>
              <div>
                <label htmlFor="stat_beneficiaries_label" className="label">Label</label>
                <input
                  id="stat_beneficiaries_label"
                  value={form.stat_beneficiaries_label || ''}
                  onChange={(e) => handleChange('stat_beneficiaries_label', e.target.value)}
                  className="input"
                  placeholder="Penerima Manfaat"
                />
              </div>
              <div>
                <label htmlFor="stat_beneficiaries" className="label">Target Angka</label>
                <input
                  id="stat_beneficiaries"
                  type="number"
                  value={form.stat_beneficiaries || ''}
                  onChange={(e) => handleChange('stat_beneficiaries', e.target.value)}
                  className="input"
                  placeholder="12000"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Indikator 3</span>
              <div>
                <label htmlFor="stat_volunteers_label" className="label">Label</label>
                <input
                  id="stat_volunteers_label"
                  value={form.stat_volunteers_label || ''}
                  onChange={(e) => handleChange('stat_volunteers_label', e.target.value)}
                  className="input"
                  placeholder="Relawan Aktif"
                />
              </div>
              <div>
                <label htmlFor="stat_volunteers" className="label">Target Angka</label>
                <input
                  id="stat_volunteers"
                  type="number"
                  value={form.stat_volunteers || ''}
                  onChange={(e) => handleChange('stat_volunteers', e.target.value)}
                  className="input"
                  placeholder="800"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Indikator 4</span>
              <div>
                <label htmlFor="stat_years_label" className="label">Label</label>
                <input
                  id="stat_years_label"
                  value={form.stat_years_label || ''}
                  onChange={(e) => handleChange('stat_years_label', e.target.value)}
                  className="input"
                  placeholder="Tahun Berkhidmat"
                />
              </div>
              <div>
                <label htmlFor="stat_years" className="label">Tahun (Angka)</label>
                <input
                  id="stat_years"
                  type="number"
                  value={form.stat_years || ''}
                  onChange={(e) => handleChange('stat_years', e.target.value)}
                  className="input"
                  placeholder="15"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. PROFIL LEMBAGA / TENTANG KAMI */}
        <div className="admin-card p-6 sm:p-8">
          <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Seksi Profil Lembaga (Tentang Kami di Beranda)
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="home_about_badge" className="label">Badge Seksi</label>
              <input
                id="home_about_badge"
                value={form.home_about_badge || ''}
                onChange={(e) => handleChange('home_about_badge', e.target.value)}
                className="input"
                placeholder="Profil Lembaga"
              />
            </div>
            <div>
              <label htmlFor="home_about_title" className="label">Judul Seksi</label>
              <input
                id="home_about_title"
                value={form.home_about_title || ''}
                onChange={(e) => handleChange('home_about_title', e.target.value)}
                className="input"
                placeholder="Dedikasi Berkelanjutan untuk Kemaslahatan Masyarakat"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="about_text" className="label">Deskripsi Profil Singkat</label>
              <textarea
                id="about_text"
                rows={3}
                value={form.about_text || ''}
                onChange={(e) => handleChange('about_text', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="home_about_card_title" className="label">Judul Kartu Sorotan</label>
              <input
                id="home_about_card_title"
                value={form.home_about_card_title || ''}
                onChange={(e) => handleChange('home_about_card_title', e.target.value)}
                className="input"
                placeholder="Sejak 2017"
              />
            </div>
            <div>
              <label htmlFor="home_about_card_subtitle" className="label">Subjudul Kartu Sorotan</label>
              <input
                id="home_about_card_subtitle"
                value={form.home_about_card_subtitle || ''}
                onChange={(e) => handleChange('home_about_card_subtitle', e.target.value)}
                className="input"
                placeholder="Dedikasi untuk kemanusiaan"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="home_about_checklist" className="label">
                Poin Keunggulan / Komitmen (Satu baris per poin)
              </label>
              <textarea
                id="home_about_checklist"
                rows={4}
                value={form.home_about_checklist || ''}
                onChange={(e) => handleChange('home_about_checklist', e.target.value)}
                className="input font-mono text-xs"
                placeholder="Tuliskan setiap butir komitmen (tekan Enter untuk baris baru)..."
              />
            </div>
            <div>
              <label htmlFor="home_about_btn_text" className="label">Teks Tombol Profil</label>
              <input
                id="home_about_btn_text"
                value={form.home_about_btn_text || ''}
                onChange={(e) => handleChange('home_about_btn_text', e.target.value)}
                className="input"
                placeholder="Profil Lengkap Lembaga"
              />
            </div>
            <div>
              <label htmlFor="home_about_btn_link" className="label">Tautan Tombol Profil</label>
              <input
                id="home_about_btn_link"
                value={form.home_about_btn_link || ''}
                onChange={(e) => handleChange('home_about_btn_link', e.target.value)}
                className="input"
                placeholder="/tentang"
              />
            </div>
            <div className="sm:col-span-2 border-t border-slate-100 pt-4">
              <ImageUploadField
                id="home_about_image"
                label="Gambar Visual Profil di Beranda"
                description="Unggah foto kegiatan, gedung sekretariat, atau dokumentasi untuk ditampilkan di samping teks profil beranda."
                value={form.home_about_image || ''}
                onChange={(val) => handleChange('home_about_image', val)}
                aspectRatio="aspect-[4/3]"
              />
            </div>
          </div>
        </div>

        {/* 6. FOKUS PILAR PROGRAM */}
        <div className="admin-card p-6 sm:p-8">
          <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Seksi Fokus Pilar Program
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="home_programs_badge" className="label">Badge Seksi</label>
              <input
                id="home_programs_badge"
                value={form.home_programs_badge || ''}
                onChange={(e) => handleChange('home_programs_badge', e.target.value)}
                className="input"
                placeholder="Pilar Program"
              />
            </div>
            <div>
              <label htmlFor="home_programs_title" className="label">Judul Seksi</label>
              <input
                id="home_programs_title"
                value={form.home_programs_title || ''}
                onChange={(e) => handleChange('home_programs_title', e.target.value)}
                className="input"
                placeholder="Fokus Pelayanan"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="home_programs_subtitle" className="label">Deskripsi Subjudul</label>
              <textarea
                id="home_programs_subtitle"
                rows={2}
                value={form.home_programs_subtitle || ''}
                onChange={(e) => handleChange('home_programs_subtitle', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="home_programs_btn_text" className="label">Teks Tombol Semua Program</label>
              <input
                id="home_programs_btn_text"
                value={form.home_programs_btn_text || ''}
                onChange={(e) => handleChange('home_programs_btn_text', e.target.value)}
                className="input"
                placeholder="Seluruh Program Pelayanan"
              />
            </div>
            <div>
              <label htmlFor="home_programs_btn_link" className="label">Tautan Tombol</label>
              <input
                id="home_programs_btn_link"
                value={form.home_programs_btn_link || ''}
                onChange={(e) => handleChange('home_programs_btn_link', e.target.value)}
                className="input"
                placeholder="/program"
              />
            </div>
          </div>
        </div>

        {/* 7. ARTIKEL TERBARU & TESTIMONI */}
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="admin-card p-6 sm:p-8">
            <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Seksi Artikel & Berita Terbaru
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="home_posts_badge" className="label">Badge Seksi</label>
                <input
                  id="home_posts_badge"
                  value={form.home_posts_badge || ''}
                  onChange={(e) => handleChange('home_posts_badge', e.target.value)}
                  className="input"
                  placeholder="Cerita & Kabar"
                />
              </div>
              <div>
                <label htmlFor="home_posts_title" className="label">Judul Seksi</label>
                <input
                  id="home_posts_title"
                  value={form.home_posts_title || ''}
                  onChange={(e) => handleChange('home_posts_title', e.target.value)}
                  className="input"
                  placeholder="Artikel Terbaru"
                />
              </div>
              <div>
                <label htmlFor="home_posts_link_text" className="label">Teks Tautan Semua Artikel</label>
                <input
                  id="home_posts_link_text"
                  value={form.home_posts_link_text || ''}
                  onChange={(e) => handleChange('home_posts_link_text', e.target.value)}
                  className="input"
                  placeholder="Lihat Semua Artikel"
                />
              </div>
            </div>
          </div>

          <div className="admin-card p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-heading text-base font-bold text-slate-900">
                Seksi Testimoni
              </h2>
              <Link to="/admin/testimonials" className="admin-btn-secondary !px-3 !py-1 text-xs">
                <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-up-right-from-square']} />
                Kelola Data Testimoni
              </Link>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="home_testimonials_badge" className="label">Badge Seksi</label>
                <input
                  id="home_testimonials_badge"
                  value={form.home_testimonials_badge || ''}
                  onChange={(e) => handleChange('home_testimonials_badge', e.target.value)}
                  className="input"
                  placeholder="Testimoni"
                />
              </div>
              <div>
                <label htmlFor="home_testimonials_title" className="label">Judul Seksi</label>
                <input
                  id="home_testimonials_title"
                  value={form.home_testimonials_title || ''}
                  onChange={(e) => handleChange('home_testimonials_title', e.target.value)}
                  className="input"
                  placeholder="Kata Mereka yang Terlayani"
                />
              </div>
              <p className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
                Data kartu pemberi testimoni (nama, peran, kutipan, foto) dapat ditambahkan dan diatur secara lengkap melalui menu{' '}
                <Link to="/admin/testimonials" className="font-semibold text-teal-700 underline">
                  Manajemen Testimoni
                </Link>.
              </p>
            </div>
          </div>
        </div>

        {/* 8. MITRA & DONATUR (MARQUEE) */}
        <div className="admin-card p-6 sm:p-8">
          <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Seksi Mitra & Donatur Pendukung (Marquee)
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="home_partners_title" className="label">Judul / Pengantar Seksi Mitra</label>
              <input
                id="home_partners_title"
                value={form.home_partners_title || ''}
                onChange={(e) => handleChange('home_partners_title', e.target.value)}
                className="input"
                placeholder="Mitra & Donatur yang Mendukung Kami"
              />
            </div>
            <div>
              <label htmlFor="home_partners_list" className="label">
                Daftar Nama Mitra / Lembaga Pendukung (Satu baris per mitra)
              </label>
              <textarea
                id="home_partners_list"
                rows={5}
                value={form.home_partners_list || ''}
                onChange={(e) => handleChange('home_partners_list', e.target.value)}
                className="input font-mono text-xs"
                placeholder="Bank Amanah&#10;PT Sejahtera Abadi&#10;Kopma Nusantara..."
              />
            </div>
          </div>
        </div>

        {/* 9. AJAKAN DONASI (CTA BANNER) */}
        <div className="admin-card p-6 sm:p-8">
          <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Seksi Ajakan Donasi (Call to Action Banner)
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="home_cta_title" className="label">Judul Banner Ajakan</label>
              <input
                id="home_cta_title"
                value={form.home_cta_title || ''}
                onChange={(e) => handleChange('home_cta_title', e.target.value)}
                className="input"
                placeholder="Sinergi Kebaikan untuk Dampak Sosial yang Nyata"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="home_cta_subtitle" className="label">Deskripsi Ajakan Donasi</label>
              <textarea
                id="home_cta_subtitle"
                rows={3}
                value={form.home_cta_subtitle || ''}
                onChange={(e) => handleChange('home_cta_subtitle', e.target.value)}
                className="input"
                placeholder="Uraian transparansi penyaluran donasi..."
              />
            </div>
            <div>
              <label htmlFor="home_cta_btn1_text" className="label">Teks Tombol Donasi</label>
              <input
                id="home_cta_btn1_text"
                value={form.home_cta_btn1_text || ''}
                onChange={(e) => handleChange('home_cta_btn1_text', e.target.value)}
                className="input"
                placeholder="Salurkan Donasi"
              />
            </div>
            <div>
              <label htmlFor="home_cta_btn1_link" className="label">Tautan Tombol Donasi</label>
              <input
                id="home_cta_btn1_link"
                value={form.home_cta_btn1_link || ''}
                onChange={(e) => handleChange('home_cta_btn1_link', e.target.value)}
                className="input"
                placeholder="/donasi"
              />
            </div>
            <div>
              <label htmlFor="home_cta_btn2_text" className="label">Teks Tombol Sekunder</label>
              <input
                id="home_cta_btn2_text"
                value={form.home_cta_btn2_text || ''}
                onChange={(e) => handleChange('home_cta_btn2_text', e.target.value)}
                className="input"
                placeholder="Pelajari Program"
              />
            </div>
            <div>
              <label htmlFor="home_cta_btn2_link" className="label">Tautan Tombol Sekunder</label>
              <input
                id="home_cta_btn2_link"
                value={form.home_cta_btn2_link || ''}
                onChange={(e) => handleChange('home_cta_btn2_link', e.target.value)}
                className="input"
                placeholder="/program"
              />
            </div>
            <div className="sm:col-span-2 border-t border-slate-100 pt-4">
              <ImageUploadField
                id="home_cta_bg_image"
                label="Gambar Latar Belakang Banner Ajakan (Opsional)"
                description="Unggah gambar latar banner ajakan donasi. Sistem akan menerapkan lapisan gelap transparan agar teks tetap jelas terbaca."
                value={form.home_cta_bg_image || ''}
                onChange={(val) => handleChange('home_cta_bg_image', val)}
                aspectRatio="aspect-[21/9]"
              />
            </div>
          </div>
        </div>

        {/* STICKY BOTTOM SAVE ACTION BAR */}
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
            <button
              type="submit"
              disabled={saving}
              className="admin-btn-primary !px-6 !py-2.5 text-xs font-bold shadow-sm w-full sm:w-auto"
            >
              {saving ? 'Menyimpan…' : 'Simpan Konten Beranda'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
