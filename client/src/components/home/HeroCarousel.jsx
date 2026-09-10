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
  const { data } = useFetch(() => getFeaturedPosts(), []);
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

  const slides = isCustom ? customSlides : posts.length > 0 ? posts : customSlides;
  const showDonationBtn = settings.menu_donasi_enabled !== 'false';

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
              <div className="container-page relative flex min-h-[520px] sm:min-h-[580px] md:min-h-[640px] lg:min-h-[700px] items-center py-20 pb-28 sm:py-24 sm:pb-32 md:py-28 md:pb-36 lg:py-32 lg:pb-40">
                <div className="max-w-2xl">
                  {(slide.category || slide.badge) && (
                    <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 ring-1 ring-white/20 backdrop-blur">
                      <FontAwesomeIcon
                        icon={
                          slide.category?.icon
                            ? [slide.category.icon.split(' ')[0], slide.category.icon.split(' ')[1]]
                            : ['fa-solid', 'fa-award']
                        }
                      />
                      {slide.category ? slide.category.name : slide.badge}
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
