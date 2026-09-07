import { useSettings } from '../../context/SettingsContext';

const DEFAULT_PARTNERS = [
  'Bank Amanah',
  'PT Sejahtera Abadi',
  'Kopma Nusantara',
  'CV Berkah Makmur',
  'Yayasan Harmoni',
  'Dinas Sosial Kota',
  'Bank Sampah Jaya',
  'Klinik Sehat Bersama',
];

export default function PartnersMarquee() {
  const { settings } = useSettings();

  const partners = settings.home_partners_list
    ? settings.home_partners_list.split('\n').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_PARTNERS;

  const title = settings.home_partners_title || 'Mitra & Donatur yang Mendukung Kami';
  const items = partners.length > 0 ? [...partners, ...partners] : [];

  if (items.length === 0) return null;

  return (
    <section className="border-y border-slate-200 bg-white py-10">
      <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
        {title}
      </p>
      <div className="relative overflow-hidden">
        {/* Fade tepi */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

        <div className="flex w-max animate-marquee gap-4">
          {items.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="flex h-12 items-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-6 text-sm font-semibold text-slate-500"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
