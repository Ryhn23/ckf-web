import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import useFetch from '../../hooks/useFetch';
import { getFeaturedPosts } from '../../api/posts';
import { useSettings } from '../../context/SettingsContext';

export default function HeroCarousel() {
  const { settings } = useSettings();
  const { data, loading: loadingPosts } = useFetch(() => getFeaturedPosts(), []);
  const posts = data?.data || [];

  const isCustom = settings.hero_mode === 'custom';

  const customSlides = [];
  // Slide 1 (selalu ada)
  customSlides.push({
    id: 'slide-1',
    title: settings.hero_slide_1_title || settings.hero_title || 'Mewujudkan Kemandirian dan Kesejahteraan Masyarakat',
    excerpt:
      settings.hero_slide_1_subtitle ||
      settings.hero_excerpt ||
      'Lembaga ini mengelola program terpadu di bidang pendidikan, layanan kesehatan, dan pemberdayaan sosial ekonomi secara transparan dan berkelanjutan.',
    coverImage: settings.hero_slide_1_image || '',
    badge: settings.hero_slide_1_badge || 'Pilar Utama Lembaga',
    btnPrimaryText: settings.hero_btn_primary_text || 'Profil Lembaga',
    btnPrimaryLink: settings.hero_btn_primary_link || '/tentang',
    btnSecondaryText: settings.hero_btn_secondary_text || 'Donasi Sekarang',
    btnSecondaryLink: settings.hero_btn_secondary_link || '/donasi',
  });

  // Slide 2 (jika diisi)
  if (settings.hero_slide_2_title || settings.hero_slide_2_image) {
    customSlides.push({
      id: 'slide-2',
      title: settings.hero_slide_2_title,
      excerpt: settings.hero_slide_2_subtitle || '',
      coverImage: settings.hero_slide_2_image || '',
      badge: settings.hero_slide_2_badge || 'Layanan Masyarakat',
      btnPrimaryText: settings.hero_slide_2_btn_text || 'Pelajari Program',
      btnPrimaryLink: settings.hero_slide_2_btn_link || '/program',
      btnSecondaryText: settings.hero_btn_secondary_text || 'Donasi Sekarang',
      btnSecondaryLink: settings.hero_btn_secondary_link || '/donasi',
    });
  }

  // Slide 3 (jika diisi)
  if (settings.hero_slide_3_title || settings.hero_slide_3_image) {
    customSlides.push({
      id: 'slide-3',
      title: settings.hero_slide_3_title,
      excerpt: settings.hero_slide_3_subtitle || '',
      coverImage: settings.hero_slide_3_image || '',
      badge: settings.hero_slide_3_badge || 'Ajakan Kebaikan',
      btnPrimaryText: settings.hero_slide_3_btn_text || 'Salurkan Donasi',
      btnPrimaryLink: settings.hero_slide_3_btn_link || '/donasi',
      btnSecondaryText: 'Pelajari Program',
      btnSecondaryLink: '/program',
    });
  }

  const showDonationBtn = settings.menu_donasi_enabled !== 'false';

  // Jangan tampilkan customSlides sementara jika sedang memuat artikel unggulan
  if (!isCustom && loadingPosts) {
    return (
      <section className="relative overflow-hidden bg-teal-900">
        <div className="container-page relative flex min-h-[480px] sm:min-h-[540px] md:min-h-[600px] lg:min-h-[640px] items-center py-16 pb-24 sm:py-20 sm:pb-28 md:py-24 md:pb-32">
          <div className="max-w-2xl space-y-4 animate-pulse">
            <div className="h-10 sm:h-12 w-3/4 rounded-2xl bg-white/20" />
            <div className="h-5 sm:h-6 w-full rounded-xl bg-white/10" />
            <div className="h-5 sm:h-6 w-2/3 rounded-xl bg-white/10" />
            <div className="pt-4 flex gap-3">
              <div className="h-11 w-36 rounded-full bg-amber-500/80" />
              {showDonationBtn && <div className="h-11 w-36 rounded-full bg-white/15" />}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const slides = isCustom ? customSlides : posts.length > 0 ? posts : customSlides;

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
              <div className="container-page relative flex min-h-[480px] sm:min-h-[540px] md:min-h-[600px] lg:min-h-[640px] items-center py-16 pb-24 sm:py-20 sm:pb-28 md:py-24 md:pb-32">
                <div className="max-w-2xl">
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
                      <Link to={slide.btnPrimaryLink || settings.hero_btn_primary_link || '/tentang'} className="btn-accent">
                        {slide.btnPrimaryText || settings.hero_btn_primary_text || 'Profil Lembaga'}
                        <FontAwesomeIcon icon={['fa-solid', 'fa-arrow-right']} />
                      </Link>
                    )}
                    {showDonationBtn && (
                      <Link
                        to={slide.btnSecondaryLink || settings.hero_btn_secondary_link || '/donasi'}
                        className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        <FontAwesomeIcon icon={['fa-solid', 'fa-hand-holding-heart']} />
                        {slide.btnSecondaryText || settings.hero_btn_secondary_text || 'Donasi Sekarang'}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Style pagination & navigation swiper */}
      <style>{`
        .hero-swiper .swiper-pagination {
          bottom: 22px !important;
        }
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
