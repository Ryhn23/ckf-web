import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSettings } from '../../context/SettingsContext';

export default function CtaDonation() {
  const { settings } = useSettings();

  const title = settings.home_cta_title || 'Sinergi Kebaikan untuk Dampak Sosial yang Nyata';
  const subtitle =
    settings.home_cta_subtitle ||
    'Donasi Anda disalurkan secara langsung ke program pendidikan, kesehatan, dan pemberdayaan masyarakat dengan pertanggungjawaban publik yang transparan.';

  const btn1Text = settings.home_cta_btn1_text || 'Salurkan Donasi';
  const btn1Link = settings.home_cta_btn1_link || '/donasi';
  const btn2Text = settings.home_cta_btn2_text || 'Pelajari Program';
  const btn2Link = settings.home_cta_btn2_link || '/program';

  const showDonationBtn = settings.menu_donasi_enabled !== 'false';

  return (
    <section className="bg-white">
      <div className="container-page py-16 lg:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-teal-900 px-6 py-14 text-center shadow-card md:px-16">
          {/* Dekorasi */}
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-20 -right-12 h-64 w-64 rounded-full bg-amber-400/10" />

          <h2 className="relative mx-auto max-w-2xl text-3xl font-bold leading-snug text-white md:text-4xl">
            {title}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-sm leading-relaxed text-teal-100 md:text-base">
            {subtitle}
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            {showDonationBtn && (
              <Link to={btn1Link} className="btn-accent">
                <FontAwesomeIcon icon={['fa-solid', 'fa-hand-holding-heart']} />
                {btn1Text}
              </Link>
            )}
            <Link
              to={btn2Link}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {btn2Text}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
