import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * Banner judul halaman publik.
 * @param {string} title judul utama
 * @param {string} [subtitle] deskripsi singkat
 * @param {Array<{label:string, to?:string}>} [crumbs] breadcrumb tambahan
 */
export default function PageHeader({ title, subtitle, crumbs = [] }) {
  return (
    <section className="bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 py-14">
      <div className="container-page text-center">
        <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">{title}</h1>
        {subtitle && <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-teal-100 md:text-base">{subtitle}</p>}
        {crumbs.length > 0 && (
          <nav aria-label="breadcrumb" className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-teal-200">
            <Link to="/" className="transition hover:text-amber-400">
              <FontAwesomeIcon icon={['fa-solid', 'fa-house']} /> Beranda
            </Link>
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-2">
                <span className="text-teal-400">/</span>
                {c.to ? (
                  <Link to={c.to} className="transition hover:text-amber-400">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-white">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}
