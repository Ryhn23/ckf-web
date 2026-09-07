import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PageHeader from '../components/layout/PageHeader';
import Seo from '../components/Seo';
import { useSettings } from '../context/SettingsContext';

const DEFAULT_TEAM = [
  { name: 'Hj. Kartika Sari', role: 'Ketua Yayasan' },
  { name: 'Budi Santoso', role: 'Sekretaris' },
  { name: 'Dra. Ratna Dewi', role: 'Bendahara' },
  { name: 'Andi Prasetyo', role: 'Koordinator Program Pendidikan' },
  { name: 'Nur Aini, S.Kep', role: 'Koordinator Program Kesehatan' },
  { name: 'Fajar Hidayat', role: 'Koordinator Relawan & Donasi' },
];

export default function About() {
  const { settings } = useSettings();

  const showHistory = settings.about_show_history !== 'false';
  const showVision = settings.about_show_vision !== 'false';
  const showValues = settings.about_show_values !== 'false';
  const showTeam = settings.about_show_team !== 'false';
  const showPartnership = settings.about_show_partnership !== 'false';

  const foundationName = settings.foundation_name || 'Yayasan Cinta Kasih Fatimah';

  // Parse team from settings
  const parsedTeam = settings.about_team_list
    ? settings.about_team_list
        .split('\n')
        .map((line) => {
          const parts = line.split('|').map((s) => s.trim());
          if (!parts[0]) return null;
          return { name: parts[0], role: parts[1] || 'Pengurus Yayasan' };
        })
        .filter(Boolean)
    : DEFAULT_TEAM;

  const team = parsedTeam.length > 0 ? parsedTeam : DEFAULT_TEAM;

  const values = [
    {
      icon: ['fa-solid', 'fa-eye'],
      title: settings.about_val1_title || 'Akuntabilitas',
      desc:
        settings.about_val1_desc ||
        'Pengelolaan dan laporan penyaluran donasi dipublikasikan secara transparan dan berkala.',
    },
    {
      icon: ['fa-solid', 'fa-hand-holding-heart'],
      title: settings.about_val2_title || 'Kepedulian Sosial',
      desc:
        settings.about_val2_desc ||
        'Merespons kebutuhan riil masyarakat prasejahtera dengan pendekatan kemanusiaan yang berkeadilan.',
    },
    {
      icon: ['fa-solid', 'fa-people-roof'],
      title: settings.about_val3_title || 'Kolaborasi Strategis',
      desc:
        settings.about_val3_desc ||
        'Bermitra dengan pemerintah, sektor swasta, dan komunitas demi optimalisasi dampak program.',
    },
    {
      icon: ['fa-solid', 'fa-arrows-rotate'],
      title: settings.about_val4_title || 'Keberlanjutan',
      desc:
        settings.about_val4_desc ||
        'Perancangan program yang berorientasi pada kemandirian jangka panjang penerima manfaat.',
    },
  ];

  const pillars = [
    {
      icon: ['fa-solid', 'fa-flag'],
      title: settings.about_vision_title || 'Visi',
      desc:
        settings.about_vision_desc ||
        'Mewujudkan kemandirian masyarakat yang berdaya, terdidik, dan sehat sejahtera.',
    },
    {
      icon: ['fa-solid', 'fa-bullseye'],
      title: settings.about_mission_title || 'Misi',
      desc:
        settings.about_mission_desc ||
        'Menyelenggarakan bantuan tepat sasaran, pembinaan kapasitas, serta menjaga tata kelola lembaga yang akuntabel.',
    },
    {
      icon: ['fa-solid', 'fa-scale-balanced'],
      title: settings.about_integrity_title || 'Integritas',
      desc:
        settings.about_integrity_desc ||
        'Menerapkan tata kelola organisasi yang transparan, audit berkala, dan kepatuhan terhadap regulasi.',
    },
    {
      icon: ['fa-solid', 'fa-lightbulb'],
      title: settings.about_innovation_title || 'Inovasi',
      desc:
        settings.about_innovation_desc ||
        'Mengoptimalkan sistem data dan teknologi untuk memperluas jangkauan penerima manfaat secara terukur.',
    },
  ];

  return (
    <>
      <Seo
        title="Tentang Kami"
        description="Kenali visi, misi, dan nilai-nilai yang menjadi dasar kerja Cinta Kasih Fatimah."
      />
      <PageHeader
        title={`Tentang ${foundationName}`}
        subtitle={
          settings.about_header_subtitle ||
          'Mengenal komitmen, visi misi, serta struktur pengurus dalam menjalankan program kemanusiaan.'
        }
        crumbs={[{ label: 'Tentang' }]}
      />

      {/* Cerita Latar Belakang & 4 Pilar */}
      {(showHistory || showVision) && (
        <section className="bg-white">
          <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
            {showHistory && (
              <div>
                <span className="mb-3 inline-block rounded-full bg-teal-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
                  {settings.about_history_badge || 'Latar Belakang'}
                </span>
                <h2 className="text-3xl font-bold leading-snug">
                  {settings.about_history_title || 'Sejarah dan Komitmen Yayasan'}
                </h2>
                <div className="mt-6 space-y-4 leading-relaxed text-slate-600">
                  <p>
                    {settings.about_history_p1 ||
                      `${foundationName} didirikan sebagai wujud kepedulian terhadap kesenjangan akses pendidikan formal dan layanan kesehatan bagi masyarakat prasejahtera. Berangkat dari inisiatif advokasi beasiswa dan distribusi kebutuhan dasar, yayasan terus mengembangkan tata kelola program yang terstruktur dan terintegrasi.`}
                  </p>
                  <p>
                    {settings.about_history_p2 ||
                      'Hingga kini, berlandaskan amanah dari para donatur dan dedikasi segenap relawan lapangan, yayasan menjalankan program pelayanan strategis secara terencana, berkeadilan, dan dapat dipertanggungjawabkan melalui pelaporan berkala secara akuntabel.'}
                  </p>
                </div>
              </div>
            )}

            {showVision && (
              <div className="grid gap-6 sm:grid-cols-2">
                {pillars.map((item) => (
                  <div key={item.title} className="card p-6">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-lg text-teal-700">
                      <FontAwesomeIcon icon={item.icon} />
                    </span>
                    <h3 className="mt-4 font-heading text-lg font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Nilai Organisasi */}
      {showValues && (
        <section className="bg-slate-50">
          <div className="container-page py-16 lg:py-24">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="mb-3 inline-block rounded-full bg-teal-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
                {settings.about_values_badge || 'Nilai Organisasi'}
              </span>
              <h2 className="text-3xl font-bold md:text-4xl">
                {settings.about_values_title || 'Prinsip Pelayanan Yayasan'}
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((v) => (
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
      )}

      {/* Susunan Pengurus & Banner Kemitraan */}
      {(showTeam || showPartnership) && (
        <section className="bg-white">
          <div className="container-page py-16 lg:py-24">
            {showTeam && (
              <>
                <div className="mx-auto mb-12 max-w-2xl text-center">
                  <span className="mb-3 inline-block rounded-full bg-teal-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
                    {settings.about_team_badge || 'Struktur Organisasi'}
                  </span>
                  <h2 className="text-3xl font-bold md:text-4xl">
                    {settings.about_team_title || 'Susunan Dewan Pengurus'}
                  </h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {team.map((member) => (
                    <div key={`${member.name}-${member.role}`} className="card flex items-center gap-4 p-6">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-lg font-bold text-white">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-heading font-bold text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {showPartnership && (
              <div className="mt-14 rounded-3xl bg-gradient-to-br from-teal-700 to-teal-900 px-6 py-12 text-center">
                <h3 className="text-2xl font-bold text-white">
                  {settings.about_cta_title || 'Kemitraan dan Partisipasi Program'}
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm text-teal-100">
                  {settings.about_cta_desc ||
                    'Yayasan membuka kesempatan kolaborasi strategis bagi instansi, donatur, maupun relawan dalam memperluas dampak kemanusiaan.'}
                </p>
                <Link
                  to={settings.about_cta_btn_link || '/kontak'}
                  className="btn-accent mt-6"
                >
                  {settings.about_cta_btn_text || 'Hubungi Sekretariat'}
                  <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-right']} />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
