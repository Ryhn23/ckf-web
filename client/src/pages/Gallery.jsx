import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../hooks/useFetch';
import { getMedia } from '../api/media';
import PageHeader from '../components/layout/PageHeader';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Seo from '../components/Seo';

const TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'photo', label: 'Foto' },
  { id: 'video', label: 'Video' },
];

function isYouTube(url) {
  return /youtube\.com|youtu\.be/i.test(url || '');
}

function youtubeEmbedUrl(url) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function Lightbox({ items, index, onClose, onPrev, onNext }) {
  const item = items[index];

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true">
      <button type="button" onClick={onClose} aria-label="Tutup" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25">
        <FontAwesomeIcon icon={['fa-solid', 'fa-xmark']} />
      </button>

      {index > 0 && (
        <button type="button" onClick={onPrev} aria-label="Sebelumnya" className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25">
          <FontAwesomeIcon icon={['fa-solid', 'fa-chevron-left']} />
        </button>
      )}
      {index < items.length - 1 && (
        <button type="button" onClick={onNext} aria-label="Berikutnya" className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25">
          <FontAwesomeIcon icon={['fa-solid', 'fa-chevron-right']} />
        </button>
      )}

      <div className="max-h-full w-full max-w-4xl">
        {item.type === 'video' && isYouTube(item.url) ? (
          <iframe
            src={youtubeEmbedUrl(item.url)}
            title={item.title}
            className="aspect-video w-full rounded-xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <img src={item.url} alt={item.title} className="max-h-[80vh] w-full rounded-xl object-contain" />
        )}
        <p className="mt-3 text-center text-sm text-white/80">
          {item.title}
          <span className="ml-2 text-white/50">
            {index + 1} / {items.length}
          </span>
        </p>
      </div>
    </div>
  );
}

export default function Gallery() {
  const { data, loading } = useFetch(() => getMedia({ limit: 24 }), []);
  const [tab, setTab] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const allItems = useMemo(() => data?.data || [], [data]);
  const items = useMemo(
    () => (tab === 'all' ? allItems : allItems.filter((m) => m.type === tab)),
    [allItems, tab],
  );

  if (loading) return <Spinner label="Memuat galeri…" />;

  return (
    <>
      <Seo title="Galeri" description="Dokumentasi kegiatan dan momen-momen bersama penerima manfaat Cinta Kasih Fatimah." />
      <PageHeader
        title="Galeri"
        subtitle="Dokumentasi kegiatan dan momen-momen bersama penerima manfaat Cinta Kasih Fatimah."
        crumbs={[{ label: 'Galeri' }]}
      />

      <section className="container-page py-10 lg:py-14">
        {/* Tabs */}
        <div className="mb-8 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setLightboxIndex(null);
              }}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${tab === t.id ? 'bg-teal-700 text-white' : 'bg-white text-slate-600 shadow hover:bg-teal-50'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <EmptyState icon="fa-images" title="Belum ada media" description="Media kegiatan akan segera diunggah." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="group relative aspect-square overflow-hidden rounded-xl bg-slate-200 text-left"
              >
                {item.type === 'video' && isYouTube(item.url) ? (
                  <img src={`https://i.ytimg.com/vi/${item.url.match(/(?:v=|youtu\.be\/)([\w-]{11})/)?.[1]}/hqdefault.jpg`} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                  <img src={item.url} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <span className="absolute bottom-2 left-2 right-2 truncate text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
                  {item.title}
                </span>
                {item.type === 'video' && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white">
                      <FontAwesomeIcon icon={['fa-solid', 'fa-play']} />
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {lightboxIndex !== null && (
        <Lightbox
          items={items}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, i - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(items.length - 1, i + 1))}
        />
      )}
    </>
  );
}
