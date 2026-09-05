import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAuth from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: 'fa-gauge', end: true },
  { to: '/admin/posts', label: 'Artikel', icon: 'fa-newspaper' },
  { to: '/admin/categories', label: 'Kategori', icon: 'fa-tags' },
  { to: '/admin/media', label: 'Media', icon: 'fa-images' },
  { to: '/admin/donations', label: 'Donasi', icon: 'fa-hand-holding-heart' },
  { to: '/admin/contact', label: 'Pesan Kontak', icon: 'fa-envelope' },
  { to: '/admin/users', label: 'Pengguna', icon: 'fa-users' },
  { to: '/admin/settings', label: 'Pengaturan', icon: 'fa-gear' },
];

function SidebarContent({ onNavigate }) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive
              ? 'bg-teal-700 text-white shadow'
              : 'text-slate-600 hover:bg-teal-50 hover:text-teal-800'
            }`
          }
        >
          <FontAwesomeIcon icon={['fa-solid', item.icon]} className="w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AdminLayout() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('ckf_admin_sidebar');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

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
    <div className="min-h-screen bg-slate-100">
      <Helmet>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Sidebar desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:flex ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center">
            <img
              src="/logo-horizontal-hitam.png"
              alt="Yayasan Cinta Kasih Fatimah"
              className="h-9 w-auto object-contain"
            />
          </div>
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
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center">
                <img
                  src="/logo-horizontal-hitam.png"
                  alt="Yayasan Cinta Kasih Fatimah"
                  className="h-9 w-auto object-contain"
                />
              </div>
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
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
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

            <div className="hidden text-sm font-semibold text-slate-700 sm:block">
              Sistem Informasi Manajemen Yayasan Cinta Kasih Fatimah
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/" target="_blank" className="btn-outline !px-3 !py-2 text-xs">
              <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-up-right-from-square']} />
              <span className="hidden sm:inline">Pratinjau Situs</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </span>
              <div className="hidden md:block">
                <p className="text-sm font-semibold leading-tight text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>
            <button type="button" onClick={handleLogout} className="btn-danger !px-3 !py-2 text-xs">
              <FontAwesomeIcon icon={['fa-solid', 'fa-right-from-bracket']} />
              <span className="hidden sm:inline">Keluar Sesi</span>
            </button>
          </div>
        </header>

        <main className="w-full p-4 sm:p-6 lg:p-8 xl:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
