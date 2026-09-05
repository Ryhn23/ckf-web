import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../hooks/useFetch';
import { getCategories } from '../api/categories';
import { getPosts } from '../api/posts';
import PageHeader from '../components/layout/PageHeader';
import PostCard from '../components/blog/PostCard';
import Seo from '../components/Seo';
import Spinner from '../components/ui/Spinner';

export default function Programs() {
  const { data: catData, loading: catLoading } = useFetch(() => getCategories(), []);
  const { data: postData, loading: postLoading } = useFetch(() => getPosts({ limit: 50 }), []);

  const categories = catData?.data || [];
  const allPosts = postData?.data || [];

  if (catLoading) return <Spinner label="Memuat program…" />;

  return (
    <>
      <Seo title="Program & Kegiatan" description="Enam pilar program Cinta Kasih Fatimah: pendidikan, kesehatan, beasiswa, sosial, kegiatan internal, dan pengumuman." />
      <PageHeader
        title="Program Kami"
        subtitle="Enam pilar program yang menjadi fokus kerja Cinta Kasih Fatimah — dari ruang kelas hingga dapur keluarga."
        crumbs={[{ label: 'Program' }]}
      />

      <section className="container-page space-y-16 py-12 lg:py-16">
        {categories.map((cat) => {
          const posts = allPosts.filter((p) => p.category?.id === cat.id).slice(0, 3);
          return (
            <div key={cat.id}>
              <div className="mb-8 flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-xl text-white">
                  <FontAwesomeIcon icon={cat.icon ? [cat.icon.split(' ')[0], cat.icon.split(' ')[1]] : ['fa-solid', 'fa-circle']} />
                </span>
                <div>
                  <h2 className="font-heading text-2xl font-bold text-slate-900">{cat.name}</h2>
                  {cat.description && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">{cat.description}</p>}
                </div>
              </div>

              {postLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200" />
                  ))}
                </div>
              ) : posts.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white py-8 text-center text-sm text-slate-500">
                  Artikel untuk program ini segera hadir.
                </p>
              )}

              <Link
                to={`/blog?category=${cat.slug}`}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline"
              >
                Lihat semua artikel {cat.name}
                <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-right']} />
              </Link>
            </div>
          );
        })}
      </section>
    </>
  );
}
