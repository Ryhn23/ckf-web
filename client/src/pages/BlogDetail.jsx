import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../hooks/useFetch';
import { getPostBySlug } from '../api/posts';
import Spinner from '../components/ui/Spinner';
import Seo from '../components/Seo';
import EmptyState from '../components/ui/EmptyState';
import PostCard from '../components/blog/PostCard';
import { formatDate } from '../utils/formatDate';

function ShareButtons({ title, url }) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const shareLinks = [
    { label: 'Facebook', icon: ['fa-brands', 'fa-facebook-f'], href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}` },
    { label: 'X (Twitter)', icon: ['fa-brands', 'fa-x-twitter'], href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodeURIComponent(title)}` },
    { label: 'WhatsApp', icon: ['fa-brands', 'fa-whatsapp'], href: `https://wa.me/?text=${encoded}` },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard ditolak — abaikan */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold text-slate-600">Bagikan:</span>
      {shareLinks.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Bagikan ke ${s.label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-600 transition hover:bg-teal-700 hover:text-white"
        >
          <FontAwesomeIcon icon={s.icon} />
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-teal-700 hover:text-white"
      >
        <FontAwesomeIcon icon={['fa-solid', copied ? 'fa-check' : 'fa-link']} />
        {copied ? 'Tersalin!' : 'Salin Tautan'}
      </button>
    </div>
  );
}

export default function BlogDetail() {
  const { slug } = useParams();
  const { data, loading, error } = useFetch(() => getPostBySlug(slug), [slug]);

  if (loading) return <Spinner label="Memuat artikel…" />;

  if (error || !data?.post) {
    return (
      <div className="container-page py-20">
        <EmptyState
          icon="fa-newspaper"
          title="Artikel tidak ditemukan"
          description="Mungkin artikel telah dipindahkan atau tautannya salah."
          action={
            <Link to="/blog" className="btn-primary mt-2">
              Kembali ke Blog
            </Link>
          }
        />
      </div>
    );
  }

  const { post, related } = data;
  const readMinutes = Math.max(1, Math.round((post.content?.length || 0) / 6000));

  return (
    <>
      <Seo title={post.title} description={post.excerpt} />
      <article>
      {/* Header */}
      <header className="bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 py-12">
        <div className="container-page max-w-4xl">
          <nav aria-label="breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-medium text-teal-200">
            <Link to="/" className="hover:text-amber-400">Beranda</Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-amber-400">Blog</Link>
            {post.category && (
              <>
                <span>/</span>
                <Link to={`/blog?category=${post.category.slug}`} className="hover:text-amber-400">
                  {post.category.name}
                </Link>
              </>
            )}
          </nav>

          {post.category && (
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 ring-1 ring-white/20">
              <FontAwesomeIcon icon={post.category.icon ? [post.category.icon.split(' ')[0], post.category.icon.split(' ')[1]] : ['fa-solid', 'fa-circle']} />
              {post.category.name}
            </span>
          )}
          <h1 className="font-heading text-3xl font-bold leading-tight text-white md:text-4xl">{post.title}</h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-teal-100">
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
                {(post.author?.name || 'A').charAt(0)}
              </span>
              {post.author?.name || 'Admin'}
            </span>
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={['fa-solid', 'fa-calendar']} />
              {formatDate(post.publishedAt || post.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={['fa-solid', 'fa-clock']} />
              {readMinutes} menit baca
            </span>
          </div>
        </div>
      </header>

      {/* Cover */}
      {post.coverImage && (
        <div className="container-page -mb-8 pt-8">
          <img src={post.coverImage} alt={post.title} className="max-h-[420px] w-full rounded-2xl object-cover shadow-card" />
        </div>
      )}

      {/* Konten */}
      <div className={`container-page max-w-4xl ${post.coverImage ? 'py-10' : 'pt-10'} pb-16`}>
        <div className="prose-post card p-6 md:p-8" dangerouslySetInnerHTML={{ __html: post.content }} />

        {/* Share */}
        <div className="mt-8">
          <ShareButtons title={post.title} url={`${window.location.origin}/blog/${post.slug}`} />
        </div>

        {/* Penulis */}
        {post.author && (
          <div className="card mt-10 flex items-center gap-4 p-6">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xl font-bold text-white">
              {post.author.name.charAt(0)}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Ditulis oleh</p>
              <p className="font-heading text-lg font-bold text-slate-900">{post.author.name}</p>
              {post.author.role && <p className="text-sm text-slate-500">{post.author.role}</p>}
            </div>
          </div>
        )}

        {/* Artikel terkait */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-6 font-heading text-2xl font-bold text-slate-900">Artikel Terkait</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}
      </div>
      </article>
    </>
  );
}
