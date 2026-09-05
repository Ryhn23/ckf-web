import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PageHeader from '../components/layout/PageHeader';
import Seo from '../components/Seo';
import { useSettings } from '../context/SettingsContext';

const VALUES = [
  { icon: ['fa-solid', 'fa-eye'], title: 'Akuntabilitas', desc: 'Pengelolaan dan laporan penyaluran donasi dipublikasikan secara transparan dan berkala.' },
  { icon: ['fa-solid', 'fa-hand-holding-heart'], title: 'Kepedulian Sosial', desc: 'Merespons kebutuhan riil masyarakat prasejahtera dengan pendekatan kemanusiaan yang berkeadilan.' },
  { icon: ['fa-solid', 'fa-people-roof'], title: 'Kolaborasi Strategis', desc: 'Bermitra dengan pemerintah, sektor swasta, dan komunitas demi optimalisasi dampak program.' },
  { icon: ['fa-solid', 'fa-arrows-rotate'], title: 'Keberlanjutan', desc: 'Perancangan program yang berorientasi pada kemandirian jangka panjang penerima manfaat.' },
];

const TEAM = [
  { name: 'Hj. Kartika Sari', role: 'Ketua Yayasan' },
  { name: 'Budi Santoso', role: 'Sekretaris' },
  { name: 'Dra. Ratna Dewi', role: 'Bendahara' },
  { name: 'Andi Prasetyo', role: 'Koordinator Program Pendidikan' },
  { name: 'Nur Aini, S.Kep', role: 'Koordinator Program Kesehatan' },
  { name: 'Fajar Hidayat', role: 'Koordinator Relawan & Donasi' },
];

export default function About() {
  const { settings } = useSettings();

  return (
    <>
      <Seo title="Tentang Kami" description="Kenali visi, misi, dan nilai-nilai yang menjadi dasar kerja Cinta Kasih Fatimah." />
      <PageHeader
        title={`Tentang ${settings.foundation_name || 'Cinta Kasih Fatimah'}`}
        subtitle="Mengenal komitmen, visi misi, serta struktur pengurus dalam menjalankan program kemanusiaan."
        crumbs={[{ label: 'Tentang' }]}
      />

      {/* Cerita */}
      <section className="bg-white">
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="mb-3 inline-block rounded-full bg-teal-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
              Latar Belakang
            </span>
            <h2 className="text-3xl font-bold leading-snug">Sejarah dan Komitmen Yayasan</h2>
            <div className="mt-6 space-y-4 leading-relaxed text-slate-600">
              <p>
                {settings.foundation_name || 'Yayasan Cinta Kasih Fatimah'} didirikan sebagai wujud kepedulian
                terhadap kesenjangan akses pendidikan formal dan layanan kesehatan bagi masyarakat prasejahtera.
                Berangkat dari inisiatif advokasi beasiswa dan distribusi kebutuhan dasar, yayasan terus
                mengembangkan tata kelola program yang terstruktur dan terintegrasi.
              </p>
              <p>
                Hingga kini, berlandaskan amanah dari para donatur dan dedikasi segenap relawan lapangan, yayasan
                menjalankan program pelayanan strategis secara terencana, berkeadilan, dan dapat dipertanggungjawabkan
                melalui pelaporan berkala secara akuntabel.
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { icon: ['fa-solid', 'fa-flag'], title: 'Visi', desc: 'Mewujudkan kemandirian masyarakat yang berdaya, terdidik, dan sehat sejahtera.' },
              { icon: ['fa-solid', 'fa-bullseye'], title: 'Misi', desc: 'Menyelenggarakan bantuan tepat sasaran, pembinaan kapasitas, serta menjaga tata kelola lembaga yang akuntabel.' },
              { icon: ['fa-solid', 'fa-scale-balanced'], title: 'Integritas', desc: 'Menerapkan tata kelola organisasi yang transparan, audit berkala, dan kepatuhan terhadap regulasi.' },
              { icon: ['fa-solid', 'fa-lightbulb'], title: 'Inovasi', desc: 'Mengoptimalkan sistem data dan teknologi untuk memperluas jangkauan penerima manfaat secara terukur.' },
            ].map((item) => (
              <div key={item.title} className="card p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-lg text-teal-700">
                  <FontAwesomeIcon icon={item.icon} />
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nilai */}
      <section className="bg-slate-50">
        <div className="container-page py-16 lg:py-24">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="mb-3 inline-block rounded-full bg-teal-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
              Nilai Organisasi
            </span>
            <h2 className="text-3xl font-bold md:text-4xl">Prinsip Pelayanan Yayasan</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="card p-6 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-xl text-white">
                  <FontAwesomeIcon icon={v.icon} />
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-slate-900">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tim */}
      <section className="bg-white">
        <div className="container-page py-16 lg:py-24">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="mb-3 inline-block rounded-full bg-teal-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
              Struktur Organisasi
            </span>
            <h2 className="text-3xl font-bold md:text-4xl">Susunan Dewan Pengurus</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((member) => (
              <div key={member.name} className="card flex items-center gap-4 p-6">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-lg font-bold text-white">
                  {member.name.charAt(0)}
                </span>
                <div>
                  <p className="font-heading font-bold text-slate-900">{member.name}</p>
                  <p className="text-sm text-slate-500">{member.role}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 rounded-3xl bg-gradient-to-br from-teal-700 to-teal-900 px-6 py-12 text-center">
            <h3 className="text-2xl font-bold text-white">Kemitraan dan Partisipasi Program</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm text-teal-100">
              Yayasan membuka kesempatan kolaborasi strategis bagi instansi, donatur, maupun relawan dalam memperluas dampak kemanusiaan.
            </p>
            <Link to="/kontak" className="btn-accent mt-6">
              Hubungi Sekretariat
              <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-right']} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
