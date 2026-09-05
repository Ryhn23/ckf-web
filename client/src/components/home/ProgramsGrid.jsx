import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getCategories } from '../../api/categories';

export default function ProgramsGrid() {
  const { data, loading } = useFetch(() => getCategories(), []);
  const categories = (data?.data || []).slice(0, 6);

  return (
    <section className="bg-slate-50">
      <div className="container-page py-16 lg:py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="mb-3 inline-block rounded-full bg-teal-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
            Program Kami
          </span>
          <h2 className="text-3xl font-bold md:text-4xl">Bidang yang Kami Layani</h2>
          <p className="mt-4 text-slate-500">
            Enam pilar program yang menjadi fokus kerja Cinta Kasih Fatimah — dari ruang kelas hingga
            dapur keluarga.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/blog?category=${cat.slug}`}
                className="card group relative overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-600 to-amber-500 opacity-0 transition group-hover:opacity-100" />
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-xl text-teal-700 transition group-hover:bg-teal-700 group-hover:text-white">
                  <FontAwesomeIcon icon={cat.icon ? [cat.icon.split(' ')[0], cat.icon.split(' ')[1]] : ['fa-solid', 'fa-circle']} />
                </span>
                <h3 className="mt-5 font-heading text-lg font-bold text-slate-900">{cat.name}</h3>
                {cat.description && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500">{cat.description}</p>
                )}
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700">
                  Lihat Artikel
                  <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-right']} className="transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link to="/program" className="btn-outline">
            Pahami Semua Program Kami
            <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-right']} />
          </Link>
        </div>
      </div>
    </section>
  );
}
