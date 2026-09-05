import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSettings } from '../../context/SettingsContext';

const CHECKLIST = [
  'Transparan dan akuntabel — laporan penyaluran dipublikasikan berkala',
  'Program berbasis asesmen kebutuhan nyata di lapangan',
  'Didukung relawan berdedikasi dan terverifikasi di berbagai wilayah',
  'Sinergi kemitraan strategis dengan pemerintah dan sektor swasta',
];

export default function AboutSection() {
  const { settings } = useSettings();
  const years = Number(settings.stat_years);
  const sinceYear = Number.isFinite(years) && years > 0 ? new Date().getFullYear() - years : 2017;

  return (
    <section className="bg-white">
      <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        {/* Visual */}
        <div className="relative">
          <div className="flex aspect-[4/3] items-center justify-center rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 shadow-card">
            <FontAwesomeIcon icon={['fa-solid', 'fa-hand-holding-heart']} className="text-8xl text-white/40" />
          </div>
          {/* Kartu mengambang */}
          <div className="absolute -bottom-6 left-6 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-lg text-amber-600">
              <FontAwesomeIcon icon={['fa-solid', 'fa-seedling']} />
            </span>
            <div>
              <p className="font-heading text-lg font-bold text-slate-900">Sejak {sinceYear}</p>
              <p className="text-xs text-slate-500">Dedikasi untuk kemanusiaan</p>
            </div>
          </div>
        </div>

        {/* Teks */}
        <div>
          <span className="mb-3 inline-block rounded-full bg-teal-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
            Profil Lembaga
          </span>
          <h2 className="text-3xl font-bold leading-snug md:text-4xl">
            Dedikasi Berkelanjutan untuk Kemaslahatan Masyarakat
          </h2>
          <p className="mt-5 leading-relaxed text-slate-600">
            {settings.about_text ||
              'Yayasan Cinta Kasih Fatimah berkhidmat memfasilitasi akses pendidikan bermutu, pelayanan kesehatan promotif-preventif, serta pemberdayaan sosial ekonomi keluarga prasejahtera melalui program yang berkelanjutan dan terukur.'}
          </p>
          <ul className="mt-6 space-y-3">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] text-teal-700">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-check']} />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <Link to="/tentang" className="btn-primary mt-8">
            Profil Lengkap Yayasan
            <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-right']} />
          </Link>
        </div>
      </div>
    </section>
  );
}
