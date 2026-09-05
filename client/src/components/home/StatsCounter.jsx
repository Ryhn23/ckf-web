import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useCountUp from '../../hooks/useCountUp';
import { useSettings } from '../../context/SettingsContext';

function StatItem({ stat }) {
  const [ref, value] = useCountUp(stat.target);
  return (
    <div ref={ref} className="flex flex-col items-center gap-3 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-xl text-amber-400">
        <FontAwesomeIcon icon={stat.icon} />
      </span>
      <p className="font-heading text-3xl font-bold text-white md:text-4xl">{stat.format(value)}</p>
      <p className="text-sm font-medium text-teal-200">{stat.label}</p>
    </div>
  );
}

export default function StatsCounter() {
  const { settings } = useSettings();
  const num = (v, fallback) => {
    const n = Number(v);
    return Number.isFinite(n) && v !== '' ? n : fallback;
  };

  // Nilai dari admin panel (Pengaturan → Statistik), fallback ke angka bawaan.
  const STATS = [
    { icon: ['fa-solid', 'fa-briefcase'], target: num(settings.stat_programs, 120), format: (v) => `${v}+`, label: 'Program Dikerjakan' },
    { icon: ['fa-solid', 'fa-people-group'], target: num(settings.stat_beneficiaries, 5000), format: (v) => v.toLocaleString('id-ID'), label: 'Penerima Manfaat' },
    { icon: ['fa-solid', 'fa-users'], target: num(settings.stat_volunteers, 350), format: (v) => `${v}+`, label: 'Relawan Aktif' },
    { icon: ['fa-solid', 'fa-calendar-check'], target: num(settings.stat_years, 8), format: (v) => `${v}`, label: 'Tahun Berkhidmat' },
  ];

  return (
    <section className="bg-teal-800">
      <div className="container-page grid grid-cols-2 gap-8 py-12 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatItem key={stat.label} stat={stat} />
        ))}
      </div>
    </section>
  );
}
