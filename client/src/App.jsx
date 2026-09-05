import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ScrollTop from './components/layout/ScrollTop';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Halaman publik
import Home from './pages/Home';
import About from './pages/About';
import Programs from './pages/Programs';
import BlogIndex from './pages/BlogIndex';
import BlogDetail from './pages/BlogDetail';
import Gallery from './pages/Gallery';
import Donate from './pages/Donate';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

// Admin (Lazy loaded untuk code-splitting)
const Login = lazy(() => import('./pages/admin/Login'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const PostsAdmin = lazy(() => import('./pages/admin/PostsAdmin'));
const PostEditor = lazy(() => import('./pages/admin/PostEditor'));
const CategoriesAdmin = lazy(() => import('./pages/admin/CategoriesAdmin'));
const MediaAdmin = lazy(() => import('./pages/admin/MediaAdmin'));
const DonationsAdmin = lazy(() => import('./pages/admin/DonationsAdmin'));
const ContactAdmin = lazy(() => import('./pages/admin/ContactAdmin'));
const UsersAdmin = lazy(() => import('./pages/admin/UsersAdmin'));
const SettingsAdmin = lazy(() => import('./pages/admin/SettingsAdmin'));

function AdminLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        <span className="text-sm font-medium text-slate-500">Memuat panel admin...</span>
      </div>
    </div>
  );
}

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter>
            <ScrollTop />
            <Routes>
              {/* Situs publik */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/tentang" element={<About />} />
                <Route path="/program" element={<Programs />} />
                <Route path="/blog" element={<BlogIndex />} />
                <Route path="/blog/:slug" element={<BlogDetail />} />
                <Route path="/galeri" element={<Gallery />} />
                <Route path="/donasi" element={<Donate />} />
                <Route path="/kontak" element={<Contact />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Login */}
              <Route
                path="/login"
                element={
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <Login />
                  </Suspense>
                }
              />

              {/* Admin (proteksi di dalam AdminLayout) */}
              <Route
                path="/admin"
                element={
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminLayout />
                  </Suspense>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="posts" element={<PostsAdmin />} />
                <Route path="posts/new" element={<PostEditor />} />
                <Route path="posts/:id/edit" element={<PostEditor />} />
                <Route path="categories" element={<CategoriesAdmin />} />
                <Route path="media" element={<MediaAdmin />} />
                <Route path="donations" element={<DonationsAdmin />} />
                <Route path="contact" element={<ContactAdmin />} />
                <Route path="users" element={<UsersAdmin />} />
                <Route path="settings" element={<SettingsAdmin />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
