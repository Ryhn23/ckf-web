import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatDate } from '../../utils/formatDate';

export default function PostCard({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="card group flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-teal-100">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-teal-300">
            <FontAwesomeIcon icon={['fa-solid', 'fa-image']} />
          </div>
        )}
        {post.category && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-teal-800 shadow">
            {post.category.name}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="line-clamp-2 font-heading text-lg font-bold leading-snug text-slate-900 transition group-hover:text-teal-700">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-500">{post.excerpt}</p>
        )}
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={['fa-solid', 'fa-user']} className="text-[10px]" />
            {post.author?.name || 'Admin'}
          </span>
          <span>{formatDate(post.publishedAt || post.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
