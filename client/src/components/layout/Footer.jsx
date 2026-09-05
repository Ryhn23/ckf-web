import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getCategories } from '../../api/categories';
import { NAV_ITEMS } from '../../utils/constants';
import { useSettings } from '../../context/SettingsContext';

export default function Footer() {
  const { data: catData } = useFetch(() => getCategories(), []);
  const categories = (catData?.data || []).slice(0, 5);
  const { settings } = useSettings();

  const socials = [
    { icon: ['fa-brands', 'fa-facebook-f'], href: settings.social_facebook || 'https://facebook.com', label: 'Facebook' },
    { icon: ['fa-brands', 'fa-instagram'], href: settings.social_instagram || 'https://instagram.com', label: 'Instagram' },
    { icon: ['fa-brands', 'fa-youtube'], href: settings.social_youtube || 'https://youtube.com', label: 'YouTube' },
    { icon: ['fa-brands', 'fa-x-twitter'], href: settings.social_x || 'https://x.com', label: 'X (Twitter)' },
  ];

  return (
    <footer className="bg-teal-900 text-teal-100">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <img
            src="/logo-horizontal-putih.png"
            alt="Yayasan Cinta Kasih Fatimah"
            className="h-10 w-auto object-contain"
          />
          <p className="mt-4 text-sm leading-relaxed text-teal-200">
            Yayasan Cinta Kasih Fatimah berkhidmat dalam penyelenggaraan program kemanusiaan, pemenuhan hak pendidikan, dan peningkatan derajat kesehatan masyarakat secara profesional dan akuntabel.
          </p>
          <div className="mt-5 flex gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm transition hover:bg-amber-500 hover:text-white"
              >
                <FontAwesomeIcon icon={s.icon} />
              </a>
            ))}
          </div>
        </div>

        {/* Navigasi */}
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Navigasi</h4>
          <ul className="space-y-2.5 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <Link to={item.path} className="text-teal-200 transition hover:text-amber-400">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Program */}
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Program Kami</h4>
          <ul className="space-y-2.5 text-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/blog?category=${c.slug}`} className="text-teal-200 transition hover:text-amber-400">
                  <FontAwesomeIcon icon={c.icon ? c.icon.split(' ') : ['fa-solid', 'fa-circle']} className="mr-2 text-xs" />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Kontak */}
        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Hubungi Kami</h4>
          <ul className="space-y-3 text-sm text-teal-200">
            <li className="flex items-start gap-3">
              <FontAwesomeIcon icon={['fa-solid', 'fa-location-dot']} className="mt-1 text-amber-400" />
              <span>{settings.address || 'Jl. Kemanusiaan No. 17, Jakarta'}</span>
            </li>
            <li className="flex items-center gap-3">
              <FontAwesomeIcon icon={['fa-solid', 'fa-phone']} className="text-amber-400" />
              <span>{settings.phone || '(021) 555-0123'}</span>
            </li>
            <li className="flex items-center gap-3">
              <FontAwesomeIcon icon={['fa-solid', 'fa-envelope']} className="text-amber-400" />
              <span>{settings.email || 'halo@ckf.or.id'}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-xs text-teal-300 sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.foundation_name || 'Cinta Kasih Fatimah'}. Hak cipta dilindungi.</p>
          <Link to="/admin" className="transition hover:text-amber-400">
            Portal Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
