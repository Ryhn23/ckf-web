import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getPosts } from '../../api/posts';
import PostCard from '../blog/PostCard';

export default function LatestPosts() {
  const { data, loading } = useFetch(() => getPosts({ limit: 3 }), []);
  const posts = data?.data || [];

  return (
    <section className="bg-white">
      <div className="container-page py-16 lg:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="mb-3 inline-block rounded-full bg-teal-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
              Cerita & Kabar
            </span>
            <h2 className="text-3xl font-bold md:text-4xl">Artikel Terbaru</h2>
          </div>
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline">
            Lihat Semua Artikel
            <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-right']} />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-96 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 py-14 text-center text-sm text-slate-500">
            Belum ada artikel yang dipublikasikan.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
