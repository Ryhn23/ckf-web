import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, NavLink, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';

const MENU_STRUCTURE = [
  {
    type: 'single',
    to: '/admin',
    label: 'Dashboard',
    icon: 'fa-gauge',
    end: true,
  },
  {
    type: 'group',
    id: 'content',
    label: 'Konten Situs',
    icon: 'fa-globe',
    items: [
      { to: '/admin/homepage', label: 'Halaman Beranda', icon: 'fa-house-laptop' },
      { to: '/admin/about', label: 'Halaman Tentang', icon: 'fa-circle-info' },
      { to: '/admin/testimonials', label: 'Testimoni', icon: 'fa-quote-left' },
      { to: '/admin/media', label: 'Galeri Media', icon: 'fa-images' },
    ],
  },
  {
    type: 'group',
    id: 'publishing',
    label: 'Publikasi & Program',
    icon: 'fa-newspaper',
    items: [
      { to: '/admin/posts', label: 'Artikel Berita', icon: 'fa-file' },
      { to: '/admin/categories', label: 'Kategori Program', icon: 'fa-tags' },
    ],
  },
  {
    type: 'group',
    id: 'services',
    label: 'Layanan & Donasi',
    icon: 'fa-hand-holding-heart',
    items: [
      { to: '/admin/donations', label: 'Donasi Masuk', icon: 'fa-sack-dollar' },
      { to: '/admin/aid-requests', label: 'Permintaan Bantuan', icon: 'fa-hand-holding-hand' },
      { to: '/admin/contact', label: 'Pesan Kontak', icon: 'fa-envelope' },
    ],
  },
  {
    type: 'group',
    id: 'system',
    label: 'Sistem & Akses',
    icon: 'fa-gear',
    items: [
      { to: '/admin/settings', label: 'Pengaturan Umum', icon: 'fa-gear' },
      { to: '/admin/users', label: 'Manajemen Pengguna', icon: 'fa-users' },
    ],
  },
];

function SidebarContent({ onNavigate }) {
  const location = useLocation();

  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};
    for (const group of MENU_STRUCTURE) {
      if (group.type === 'group') {
        const isChildActive = group.items.some((item) =>
          item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to)
        );
        initial[group.id] = isChildActive || group.id === 'content';
      }
    }
    return initial;
  });

  useEffect(() => {
    for (const group of MENU_STRUCTURE) {
      if (group.type === 'group') {
        const isChildActive = group.items.some((item) =>
          item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to)
        );
        if (isChildActive) {
          setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
        }
      }
    }
  }, [location.pathname]);

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar px-3 py-4">
      {MENU_STRUCTURE.map((entry) => {
        if (entry.type === 'single') {
          return (
            <NavLink
              key={entry.to}
              to={entry.to}
              end={entry.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <FontAwesomeIcon icon={['fa-solid', entry.icon]} className="w-4 text-center" />
              {entry.label}
            </NavLink>
          );
        }

        const isOpen = !!openGroups[entry.id];
        const isChildActive = entry.items.some((item) =>
          item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to)
        );

        return (
          <div key={entry.id} className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup(entry.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition ${
                isChildActive
                  ? 'text-slate-900 bg-slate-100 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <FontAwesomeIcon
                  icon={['fa-solid', entry.icon]}
                  className={`w-4 text-center ${isChildActive ? 'text-slate-900' : 'text-slate-400'}`}
                />
                <span>{entry.label}</span>
              </div>
              <FontAwesomeIcon
                icon={['fa-solid', 'fa-chevron-down']}
                className={`text-xs transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-slate-800' : 'text-slate-400'
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key={`submenu-${entry.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: 'auto',
                    opacity: 1,
                    transition: {
                      height: { duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] },
                      opacity: { duration: 0.16, delay: 0.04 },
                    },
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    transition: {
                      height: { duration: 0.18, ease: [0.04, 0.62, 0.23, 0.98] },
                      opacity: { duration: 0.1 },
                    },
                  }}
                  className="overflow-hidden ml-3.5 space-y-1 border-l-2 border-slate-100 pl-2.5 py-0.5"
                >
                  {entry.items.map((subItem) => (
                    <NavLink
                      key={subItem.to}
                      to={subItem.to}
                      end={subItem.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                          isActive
                            ? 'bg-slate-900 text-white font-semibold shadow-xs'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={`h-1.5 w-1.5 rounded-full transition-all ${
                              isActive ? 'bg-white scale-125' : 'bg-slate-300'
                            }`}
                          />
                          <span className="truncate">{subItem.label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}

function getBreadcrumbs(pathname) {
  if (pathname === '/admin' || pathname === '/admin/') {
    return [{ label: 'Dashboard', current: true }];
  }
  if (pathname.startsWith('/admin/posts/new')) {
    return [
      { label: 'Artikel', to: '/admin/posts' },
      { label: 'Tulis Artikel', current: true },
    ];
  }
  if (pathname.includes('/admin/posts/') && pathname.endsWith('/edit')) {
    return [
      { label: 'Artikel', to: '/admin/posts' },
      { label: 'Edit Artikel', current: true },
    ];
  }
  for (const group of MENU_STRUCTURE) {
    if (group.type === 'group') {
      const found = group.items.find(
        (item) => item.to === pathname || pathname.startsWith(item.to + '/')
      );
      if (found) {
        return [
          { label: group.label, current: false },
          { label: found.label, current: true },
        ];
      }
    }
  }
  return [{ label: 'Admin', current: true }];
}

export default function AdminLayout() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('ckf_admin_sidebar');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const breadcrumbs = getBreadcrumbs(location.pathname);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ckf_admin_sidebar', String(next));
      } catch {}
      return next;
    });
  };

  if (loading) return <Spinner label="Memeriksa sesi…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const sidebar = (
    <SidebarContent onNavigate={() => setMobileOpen(false)} />
  );

  return (
    <div className="min-h-screen bg-slate-50/70">
      <Helmet>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Sidebar desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/80 bg-white shadow-sm transition-transform duration-300 ease-in-out lg:flex ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <Link to="/admin" className="flex items-center gap-2.5 group select-none">
            <img
              src="/logo.png"
              alt="Logo Cinta Kasih Fatimah"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col justify-center leading-none text-slate-900">
              <span className="font-heading text-[10px] font-extrabold uppercase tracking-wider text-slate-900">
                CINTA KASIH
              </span>
              <span className="font-heading text-[14px] font-black uppercase tracking-wide mt-0.5 text-black">
                FATIMAH
              </span>
              <span className="font-sans text-[7.5px] font-bold uppercase tracking-[0.2em] mt-0.5 text-slate-900">
                FOUNDATION
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            title="Sembunyikan Bilah Samping"
            aria-label="Sembunyikan Bilah Samping"
          >
            <FontAwesomeIcon icon={['fa-solid', 'fa-chevron-left']} className="w-3.5" />
          </button>
        </div>
        {sidebar}
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <Link to="/admin" className="flex items-center gap-2.5 select-none" onClick={() => setMobileOpen(false)}>
                <img
                  src="/logo.png"
                  alt="Logo Cinta Kasih Fatimah"
                  className="h-10 w-auto object-contain"
                />
                <div className="flex flex-col justify-center leading-none text-slate-900">
                  <span className="font-heading text-[10px] font-extrabold uppercase tracking-wider text-slate-900">
                    CINTA KASIH
                  </span>
                  <span className="font-heading text-[14px] font-black uppercase tracking-wide mt-0.5 text-black">
                    FATIMAH
                  </span>
                  <span className="font-sans text-[7.5px] font-bold uppercase tracking-[0.2em] mt-0.5 text-slate-900">
                    FOUNDATION
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Tutup menu"
              >
                <FontAwesomeIcon icon={['fa-solid', 'fa-xmark']} />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Konten */}
      <div className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'}`}>
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Buka Navigasi"
            >
              <FontAwesomeIcon icon={['fa-solid', 'fa-bars']} />
            </button>

            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-teal-700 lg:inline-flex"
              title={sidebarOpen ? 'Sembunyikan Bilah Samping' : 'Tampilkan Bilah Samping'}
              aria-label={sidebarOpen ? 'Sembunyikan Bilah Samping' : 'Tampilkan Bilah Samping'}
            >
              <FontAwesomeIcon icon={['fa-solid', sidebarOpen ? 'fa-bars-staggered' : 'fa-bars']} />
            </button>

            {/* Breadcrumb navigasi dinamis */}
            <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-xs">
              <Link to="/admin" className="font-medium text-slate-500 hover:text-teal-700 transition">
                Admin
              </Link>
              {breadcrumbs.map((crumb, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-slate-300">/</span>
                  {crumb.current ? (
                    <span className="font-semibold text-slate-900">{crumb.label}</span>
                  ) : crumb.to ? (
                    <Link to={crumb.to} className="font-medium text-slate-500 hover:text-teal-700 transition">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-slate-500">{crumb.label}</span>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="admin-btn-secondary !px-3 !py-1.5 text-xs font-semibold"
            >
              <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-up-right-from-square']} className="text-slate-400" />
              <span className="hidden sm:inline">Lihat Web</span>
            </Link>

            <div className="flex items-center gap-2.5 pl-1 pr-1 border-l border-slate-200">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </span>
              <div className="hidden md:block">
                <p className="text-xs font-bold leading-tight text-slate-800">{user?.name}</p>
                <p className="text-[11px] text-slate-400 font-medium">{user?.role || 'Admin'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="admin-btn-secondary !px-2.5 !py-1.5 text-xs text-slate-600 hover:text-rose-600 hover:border-rose-200 transition"
              title="Logout"
            >
              <FontAwesomeIcon icon={['fa-solid', 'fa-right-from-bracket']} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="w-full p-4 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
