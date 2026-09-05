import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PageHeader from '../components/layout/PageHeader';
import Seo from '../components/Seo';
import { useSettings } from '../context/SettingsContext';

const VALUES = [
  { icon: ['fa-solid', 'fa-eye'], title: 'Transparan', desc: 'Setiap rupiah donasi dipublikasikan penggunaannya dalam laporan berkala.' },
  { icon: ['fa-solid', 'fa-hand-holding-heart'], title: 'Empati', desc: 'Kami hadir dengan hati, mendengar kebutuhan riil masyarakat terlayani.' },
  { icon: ['fa-solid', 'fa-people-roof'], title: 'Kolaboratif', desc: 'Bekerja bersama pemerintah, dunia usaha, dan relawan untuk dampak maksimal.' },
  { icon: ['fa-solid', 'fa-arrows-rotate'], title: 'Berkelanjutan', desc: 'Program dirancang agar mandiri dan berkelanjutan, bukan sekadar bantuan sesaat.' },
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
        subtitle="Mengenal lebih dekat siapa kami, apa yang kami percaya, dan orang-orang di balik setiap program."
        crumbs={[{ label: 'Tentang' }]}
      />

      {/* Cerita */}
      <section className="bg-white">
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="mb-3 inline-block rounded-full bg-teal-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
              Cerita Kami
            </span>
            <h2 className="text-3xl font-bold leading-snug">Dari Kepedulian Sederhana, Menjadi Gerakan</h2>
            <div className="mt-6 space-y-4 leading-relaxed text-slate-600">
              <p>
                {settings.foundation_name || 'Cinta Kasih Fatimah'} berdiri pada 2017 dari sekelompok kecil relawan yang prihatin melihat
                anak-anak putus sekolah dan keluarga yang kesulitan mengakses layanan kesehatan.
                Dari aksi-aksi kecil — mengumpulkan buku, menyalurkan paket sembako, hingga
                mendampingi pemeriksaan kesehatan — kami belajar bahwa perubahan besar lahir dari
                konsistensi.
              </p>
              <p>
                Hari ini, bersama ratusan relawan dan ribuan donatur, kami menjalankan enam pilar
                program di berbagai wilayah. Prinsipnya tidak pernah berubah: dengarkan, layani
                dengan hati, dan laporkan secara transparan.
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { icon: ['fa-solid', 'fa-flag'], title: 'Visi', desc: 'Masyarakat yang sehat, terdidik, dan berdaya menentukan masa depannya sendiri.' },
              { icon: ['fa-solid', 'fa-bullseye'], title: 'Misi', desc: 'Menyalurkan bantuan tepat sasaran, membangun kapasitas lokal, dan menjaga kepercayaan publik.' },
              { icon: ['fa-solid', 'fa-scale-balanced'], title: 'Integritas', desc: 'Tata kelola yayasan yang sehat, audit rutin, dan kepatuhan penuh terhadap regulasi.' },
              { icon: ['fa-solid', 'fa-lightbulb'], title: 'Inovasi', desc: 'Menggunakan data dan teknologi untuk menjangkau lebih banyak penerima manfaat.' },
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
              Nilai Kami
            </span>
            <h2 className="text-3xl font-bold md:text-4xl">Empat Pilar yang Kami Pegang</h2>
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
              Tim Kami
            </span>
            <h2 className="text-3xl font-bold md:text-4xl">Orang-orang di Balik Gerakan</h2>
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
            <h3 className="text-2xl font-bold text-white">Ingin Bergabung dengan Kami?</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm text-teal-100">
              Baik sebagai relawan, donatur, maupun mitra program — pintu kami selalu terbuka.
            </p>
            <Link to="/kontak" className="btn-accent mt-6">
              Hubungi Kami
              <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-right']} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
