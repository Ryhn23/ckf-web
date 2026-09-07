import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NAV_ITEMS } from '../../utils/constants';
import { useSettings } from '../../context/SettingsContext';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group py-1">
      <img
        src="/logo.png"
        alt="Logo Cinta Kasih Fatimah"
        className="h-11 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
      />
      <div className="flex flex-col justify-center leading-none select-none text-slate-900">
        <span className="font-heading text-[11px] sm:text-[12px] font-extrabold uppercase tracking-wider text-slate-900">
          CINTA KASIH
        </span>
        <span className="font-heading text-[15px] sm:text-[17px] font-black uppercase tracking-wide mt-0.5 text-black">
          FATIMAH
        </span>
        <span className="font-sans text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5 text-slate-900">
          FOUNDATION
        </span>
      </div>
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { settings } = useSettings();

  const socials = [
    { icon: ['fa-brands', 'fa-facebook-f'], href: settings.social_facebook || 'https://facebook.com', label: 'Facebook' },
    { icon: ['fa-brands', 'fa-instagram'], href: settings.social_instagram || 'https://instagram.com', label: 'Instagram' },
    { icon: ['fa-brands', 'fa-youtube'], href: settings.social_youtube || 'https://youtube.com', label: 'YouTube' },
  ];

  // Tutup menu mobile saat pindah halaman
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const isNavVisible = (path) => {
    if (path === '/donasi' && settings.menu_donasi_enabled === 'false') return false;
    if (path === '/program' && settings.menu_program_enabled === 'false') return false;
    if (path === '/blog' && settings.menu_blog_enabled === 'false') return false;
    if (path === '/galeri' && settings.menu_galeri_enabled === 'false') return false;
    if (path === '/bantuan' && settings.menu_bantuan_enabled === 'false') return false;
    if (path === '/kontak' && settings.menu_kontak_enabled === 'false') return false;
    if (path === '/tentang' && settings.menu_tentang_enabled === 'false') return false;
    return true;
  };

  const navItems = NAV_ITEMS.filter((item) => isNavVisible(item.path));
  const showDonationCta = settings.menu_donasi_enabled !== 'false';

  const linkClass = ({ isActive }) =>
    `rounded-full px-3.5 py-2 text-sm font-semibold transition ${isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-40">
      {/* Top bar */}
      <div className="hidden bg-teal-800 text-teal-50 md:block">
        <div className="container-page flex h-9 items-center justify-between text-xs">
          <p className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <FontAwesomeIcon icon={['fa-solid', 'fa-phone']} className="text-[10px]" />
              {settings.phone || '(021) 555-0123'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FontAwesomeIcon icon={['fa-solid', 'fa-envelope']} className="text-[10px]" />
              {settings.email || 'halo@ckf.or.id'}
            </span>
          </p>
          <div className="flex items-center gap-3">
            {socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="hover:text-amber-400">
                <FontAwesomeIcon icon={s.icon} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main bar */}
      <nav className="border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="container-page flex h-20 items-center justify-between gap-4">
          <Logo />

          {/* Desktop */}
          <div className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <NavLink key={item.path} to={item.path} end={item.path === '/'} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>

          {showDonationCta && (
            <div className="hidden lg:block">
              <Link to="/donasi" className="btn-accent">
                <FontAwesomeIcon icon={['fa-solid', 'fa-hand-holding-heart']} />
                Donasi Sekarang
              </Link>
            </div>
          )}

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
          >
            <FontAwesomeIcon icon={['fa-solid', open ? 'fa-xmark' : 'fa-bars']} className="text-xl" />
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="border-t border-slate-200 bg-white lg:hidden">
            <div className="container-page flex flex-col gap-1 py-3">
              {navItems.map((item) => (
                <NavLink key={item.path} to={item.path} end={item.path === '/'} className={linkClass}>
                  {item.label}
                </NavLink>
              ))}
              {showDonationCta && (
                <Link to="/donasi" className="btn-accent mt-2 w-full">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-hand-holding-heart']} />
                  Donasi Sekarang
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
