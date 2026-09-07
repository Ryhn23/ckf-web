import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { parseFaIcon } from '../utils/iconUtils';
import useFetch from '../hooks/useFetch';
import { getCategories } from '../api/categories';
import PageHeader from '../components/layout/PageHeader';
import Seo from '../components/Seo';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

export default function Programs() {
  const { data: catData, loading: catLoading, error } = useFetch(() => getCategories(), []);
  const categories = catData?.data || [];

  return (
    <>
      <Seo
        title="Program & Kegiatan"
        description="Direktori pilar program pelayanan Yayasan Cinta Kasih Fatimah dalam bidang pendidikan, kesehatan, beasiswa, dan kesejahteraan sosial."
      />
      <PageHeader
        title="Program Pelayanan & Kegiatan"
        subtitle="Pilar program kerja terstruktur Yayasan Cinta Kasih Fatimah yang dirancang untuk mewujudkan kebermanfaatan nyata, berdaya guna, dan berkelanjutan."
        crumbs={[{ label: 'Program' }]}
      />

      <section className="container-page py-12 lg:py-16">
        {/* Ringkasan Misi Program */}
        <div className="mb-12 rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 p-8 text-white shadow-xl lg:p-10">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <span className="inline-block rounded-full bg-teal-700/80 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-200">
                Pilar Keberlanjutan Yayasan
              </span>
              <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Pendekatan Holistik untuk Kesejahteraan Umat
              </h2>
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-teal-100/90 sm:text-base">
                Seluruh program dirancang dengan asesmen kebutuhan mendalam di lapangan, pelaksanaan terukur, serta pelaporan terbuka demi memastikan setiap donasi dan kepedulian Anda tepat sasaran.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
              <Link to="/donasi" className="btn-primary !border-teal-400 !bg-teal-500 !text-white hover:!bg-teal-400">
                <FontAwesomeIcon icon={['fa-solid', 'fa-heart']} />
                Donasi Sekarang
              </Link>
              <Link to="/blog" className="btn-outline !border-white/30 !bg-white/10 !text-white hover:!bg-white/20">
                <FontAwesomeIcon icon={['fa-solid', 'fa-newspaper']} />
                Warta & Dokumentasi
              </Link>
            </div>
          </div>
        </div>

        {/* Daftar Direktori Program */}
        {catLoading ? (
          <Spinner label="Memuat pilar program…" />
        ) : error ? (
          <EmptyState
            icon="fa-triangle-exclamation"
            title="Gagal memuat program"
            description="Terjadi kendala saat memuat data pilar program. Silakan muat ulang halaman."
          />
        ) : categories.length === 0 ? (
          <EmptyState
            icon="fa-folder-open"
            title="Belum ada data program"
            description="Data program pelayanan sedang dipersiapkan oleh pengurus yayasan."
          />
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className="card flex flex-col justify-between overflow-hidden border border-slate-200/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/40 hover:shadow-xl"
              >
                <div>
                  {/* Top bar: Ikon & Urutan */}
                  <div className="flex items-center justify-between">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-2xl text-white shadow-md shadow-teal-700/20">
                      <FontAwesomeIcon icon={parseFaIcon(cat.icon)} />
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      Pilar 0{idx + 1}
                    </span>
                  </div>

                  {/* Judul & Uraian Program */}
                  <h3 className="mt-5 font-heading text-xl font-bold text-slate-900">
                    {cat.name}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                    {cat.description || 'Program kerja aktif Yayasan Cinta Kasih Fatimah dalam mewujudkan pelayanan masyarakat.'}
                  </p>

                  {/* Metadata Sasaran & Capaian */}
                  <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
                    {cat.target && (
                      <div className="rounded-xl bg-slate-50 p-3.5">
                        <div className="flex items-start gap-2.5">
                          <FontAwesomeIcon icon={['fa-solid', 'fa-bullseye']} className="mt-0.5 text-xs text-teal-700" />
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                              Sasaran Penerima
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-slate-800 leading-snug">
                              {cat.target}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {cat.impact && (
                      <div className="rounded-xl bg-teal-50/70 p-3.5">
                        <div className="flex items-start gap-2.5">
                          <FontAwesomeIcon icon={['fa-solid', 'fa-chart-line']} className="mt-0.5 text-xs text-teal-800" />
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700">
                              Capaian &amp; Dampak
                            </p>
                            <p className="mt-0.5 text-xs font-semibold text-teal-900 leading-snug">
                              {cat.impact}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Link
                      to={`/donasi?program=${cat.slug}`}
                      className="btn-primary flex-1 justify-center !py-2.5 text-xs shadow-sm"
                    >
                      <FontAwesomeIcon icon={['fa-solid', 'fa-hand-holding-heart']} />
                      Salurkan Donasi
                    </Link>
                    <Link
                      to={`/blog?category=${cat.slug}`}
                      className="btn-outline justify-center !py-2.5 text-xs"
                      title={`Lihat artikel dan warta kegiatan ${cat.name}`}
                    >
                      <FontAwesomeIcon icon={['fa-solid', 'fa-newspaper']} />
                      Warta Kegiatan
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Section Komitmen & Akuntabilitas */}
        <div className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <FontAwesomeIcon icon={['fa-solid', 'fa-shield-halved']} className="text-xl" />
            </span>
            <h3 className="mt-4 font-heading text-2xl font-bold text-slate-900">
              Komitmen Transparansi dan Akuntabilitas
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              Setiap realisasi kegiatan dan penyaluran dana diawasi secara ketat dan didokumentasikan secara berkala. Seluruh laporan kegiatan dipublikasikan melalui kanal warta dan laporan tahunan resmi yayasan.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/donasi" className="btn-primary text-sm">
                <FontAwesomeIcon icon={['fa-solid', 'fa-heart']} />
                Salurkan Donasi Umum
              </Link>
              <Link to="/kontak" className="btn-outline text-sm">
                <FontAwesomeIcon icon={['fa-solid', 'fa-envelope']} />
                Hubungi Pengurus
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
