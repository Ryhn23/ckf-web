import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import useFetch from '../../hooks/useFetch';
import { getFeaturedPosts } from '../../api/posts';

const FALLBACK_SLIDES = [
  {
    title: 'Berbagi Harapan, Membangun Masa Depan',
    excerpt:
      'Cinta Kasih Fatimah mendampingi anak-anak dan keluarga kurang mampu melalui program pendidikan, kesehatan, dan pemberdayaan ekonomi.',
  },
];

export default function HeroCarousel() {
  const { data } = useFetch(() => getFeaturedPosts(), []);
  const posts = data?.data || [];
  const slides = posts.length > 0 ? posts : FALLBACK_SLIDES;

  return (
    <section className="relative overflow-hidden bg-teal-900">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop={slides.length > 1}
        className="hero-swiper"
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={slide.id ?? i}>
            <div className="relative">
              {/* Latar */}
              {slide.coverImage ? (
                <img src={slide.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-teal-950/90 via-teal-900/70 to-teal-900/30" />

              {/* Konten */}
              <div className="container-page relative flex min-h-[420px] items-center py-16 md:min-h-[520px]">
                <div className="max-w-2xl">
                  {slide.category && (
                    <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 ring-1 ring-white/20 backdrop-blur">
                      <FontAwesomeIcon icon={slide.category.icon ? [slide.category.icon.split(' ')[0], slide.category.icon.split(' ')[1]] : ['fa-solid', 'fa-circle']} />
                      {slide.category.name}
                    </span>
                  )}
                  <h1 className="font-heading text-3xl font-bold leading-tight text-white md:text-5xl">
                    {slide.title}
                  </h1>
                  {slide.excerpt && (
                    <p className="mt-4 hidden text-base leading-relaxed text-teal-100 md:block">{slide.excerpt}</p>
                  )}
                  <div className="mt-8 flex flex-wrap gap-3">
                    {slide.slug ? (
                      <Link to={`/blog/${slide.slug}`} className="btn-accent">
                        Baca Selengkapnya
                        <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-right']} />
                      </Link>
                    ) : (
                      <Link to="/tentang" className="btn-accent">
                        Kenali Kami
                        <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-right']} />
                      </Link>
                    )}
                    <Link
                      to="/donasi"
                      className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      <FontAwesomeIcon icon={['fa-solid', 'fa-hand-holding-heart']} />
                      Donasi Sekarang
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Style pagination & navigation swiper */}
      <style>{`
        .hero-swiper .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.5);
          opacity: 1;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          background: #f59e0b;
        }
        .hero-swiper .swiper-button-next,
        .hero-swiper .swiper-button-prev {
          color: #fff;
          --swiper-navigation-size: 22px;
          background: rgba(255, 255, 255, 0.12);
          width: 44px;
          height: 44px;
          border-radius: 9999px;
        }
        .hero-swiper .swiper-button-next:hover,
        .hero-swiper .swiper-button-prev:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </section>
  );
}
