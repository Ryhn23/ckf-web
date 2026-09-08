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
        description="Direktori pilar program pelayanan dalam bidang pendidikan, kesehatan, beasiswa, dan kesejahteraan sosial."
      />
      <PageHeader
        title="Program Pelayanan & Kegiatan"
        subtitle="Pilar program kerja terstruktur yang dirancang untuk mewujudkan kebermanfaatan nyata, berdaya guna, dan berkelanjutan."
        crumbs={[{ label: 'Program' }]}
      />

      <section className="container-page py-12 lg:py-16">
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
            description="Data program pelayanan sedang dipersiapkan oleh pengurus."
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
                    {cat.description || 'Program kerja aktif dalam mewujudkan pelayanan masyarakat.'}
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
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
