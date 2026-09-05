import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../hooks/useFetch';
import { getPosts } from '../api/posts';
import { getCategories } from '../api/categories';
import PostCard from '../components/blog/PostCard';
import PageHeader from '../components/layout/PageHeader';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Seo from '../components/Seo';

export default function BlogIndex() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;

  const { data, loading } = useFetch(
    () => getPosts({ q, category, sort, page }),
    [q, category, sort, page],
  );
  const { data: catData } = useFetch(() => getCategories(), []);

  const posts = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 9, totalPages: 1 };
  const categories = catData?.data || [];

  // Input pencarian lokal + debounce agar tidak re-fetch setiap ketikan
  const [qInput, setQInput] = useState(q);
  useEffect(() => {
    setQInput(q);
  }, [q]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (qInput !== q) updateParams({ q: qInput });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  function updateParams(patch) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === '' || value == null) next.delete(key);
      else next.set(key, value);
    });
    if (!('page' in patch)) next.delete('page');
    setSearchParams(next);
  }

  function goToPage(p) {
    updateParams({ page: p });
  }

  return (
    <>
      <Seo title="Blog & Artikel" description="Cerita, kabar kegiatan, dan laporan program Cinta Kasih Fatimah — ditulis dari lapangan untuk Anda." />
      <PageHeader
        title="Blog & Artikel"
        subtitle="Cerita, kabar kegiatan, dan laporan program Cinta Kasih Fatimah — ditulis dari lapangan untuk Anda."
        crumbs={[{ label: 'Blog' }]}
      />

      <section className="container-page py-10 lg:py-14">
        {/* Filter bar */}
        <div className="card mb-8 flex flex-col gap-4 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <FontAwesomeIcon
              icon={['fa-solid', 'fa-magnifying-glass']}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Cari artikel…"
              className="input pl-10"
              aria-label="Cari artikel"
            />
          </div>
          <select
            value={category}
            onChange={(e) => updateParams({ category: e.target.value })}
            className="input md:w-56"
            aria-label="Filter kategori"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="input md:w-44"
            aria-label="Urutkan artikel"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
          </select>
        </div>

        {/* Hasil */}
        {loading ? (
          <Spinner label="Memuat artikel…" />
        ) : posts.length === 0 ? (
          <EmptyState
            icon="fa-newspaper"
            title="Tidak ada artikel yang cocok"
            description="Coba ubah kata kunci pencarian atau pilih kategori lain."
          />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Halaman artikel">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="btn-outline px-4 py-2 text-xs disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={['fa-solid', 'fa-chevron-left']} />
                  Sebelumnya
                </button>
                {Array.from({ length: meta.totalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goToPage(i + 1)}
                    aria-current={page === i + 1 ? 'page' : undefined}
                    className={`h-9 w-9 rounded-full text-sm font-semibold transition ${page === i + 1 ? 'bg-teal-700 text-white' : 'bg-white text-slate-600 shadow hover:bg-teal-50'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= meta.totalPages}
                  className="btn-outline px-4 py-2 text-xs disabled:opacity-50"
                >
                  Berikutnya
                  <FontAwesomeIcon icon={['fa-solid', 'fa-chevron-right']} />
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </>
  );
}
