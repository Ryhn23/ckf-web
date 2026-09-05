import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getTestimonials } from '../../api/testimonials';
import 'swiper/css';
import 'swiper/css/pagination';

const DEFAULT_TESTIMONIALS = [
  {
    quote:
      'Berkat beasiswa CKF, saya bisa melanjutkan kuliah tanpa membebani orang tua. Sekarang saya kembali menjadi relawan di akhir pekan.',
    name: 'Rina Marlina',
    role: 'Penerima Beasiswa Pendidikan',
  },
  {
    quote:
      'Posyandu keliling yang diadakan yayasan sangat membantu ibu-ibu di kampung kami. Anak-anak rutin ditimbang dan imunisasinya tertib.',
    name: 'Bu Siti Rohmah',
    role: 'Ibu Penerima Program Kesehatan',
  },
  {
    quote:
      'Pelatihan keterampilan menjahit mengubah hidup kelompok kami. Sekarang pesanan datang dari luar kota dan kami punya penghasilan tetap.',
    name: 'Kartini dkk.',
    role: 'Kelompok Perempuan Berdaya',
  },
  {
    quote:
      'Sebagai donatur, saya selalu menerima laporan penggunaan dana secara transparan. Ini yang membuat saya percaya untuk berdonasi rutin.',
    name: 'Pak Hendra Wijaya',
    role: 'Donatur Rutin',
  },
];

export default function Testimonials() {
  const { data } = useFetch(() => getTestimonials(), []);
  const testimonials = data?.data && data.data.length > 0 ? data.data : DEFAULT_TESTIMONIALS;

  return (
    <section className="bg-slate-50">
      <div className="container-page py-16 lg:py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="mb-3 inline-block rounded-full bg-teal-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
            Testimoni
          </span>
          <h2 className="text-3xl font-bold md:text-4xl">Kata Mereka yang Terlayani</h2>
        </div>

        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{ delay: 4500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          spaceBetween={24}
          slidesPerView={1}
          breakpoints={{
            768: { slidesPerView: 2 },
            1100: { slidesPerView: 3 },
          }}
        >
          {testimonials.map((t, idx) => (
            <SwiperSlide key={t.id || t.name || idx} className="h-auto">
              <figure className="card flex h-full flex-col p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-500">
                  <FontAwesomeIcon icon={['fa-solid', 'fa-quote-left']} />
                </span>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                  {t.avatar ? (
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
                      {t.name.charAt(0)}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
