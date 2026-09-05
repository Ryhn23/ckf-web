import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Seo from '../components/Seo';

export default function NotFound() {
  return (
    <>
      <Seo title="Halaman Tidak Ditemukan" />
      <section className="container-page flex flex-col items-center py-28 text-center">
      <p className="font-heading text-8xl font-bold text-teal-100">404</p>
      <h1 className="mt-4 font-heading text-3xl font-bold text-slate-900">Halaman Tidak Ditemukan</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
        Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau tidak pernah ada.
      </p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="btn-primary">
          <FontAwesomeIcon icon={['fa-solid', 'fa-house']} />
          Kembali ke Beranda
        </Link>
        <Link to="/blog" className="btn-outline">
          Lihat Artikel
        </Link>
      </div>
    </section>
    </>
  );
}
