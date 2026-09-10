import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useCountUp from '../../hooks/useCountUp';
import { useSettings } from '../../context/SettingsContext';

function StatItem({ stat }) {
  const [ref, value] = useCountUp(stat.target);
  return (
    <div ref={ref} className="flex flex-col items-center gap-2 text-center">
      <span className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/10 text-lg sm:text-xl text-amber-400">
        <FontAwesomeIcon icon={stat.icon} />
      </span>
      <p className="font-heading text-2xl font-bold text-white md:text-3xl">{stat.format(value)}</p>
      <p className="text-xs font-medium text-teal-200 sm:text-sm">{stat.label}</p>
    </div>
  );
}

export default function StatsCounter() {
  const { settings } = useSettings();
  const num = (v, fallback) => {
    const n = Number(v);
    return Number.isFinite(n) && v !== '' ? n : fallback;
  };

  const STATS = [
    {
      icon: ['fa-solid', 'fa-briefcase'],
      target: num(settings.stat_programs, 350),
      format: (v) => `${v.toLocaleString('id-ID')}+`,
      label: settings.stat_programs_label || 'Program Dikerjakan',
    },
    {
      icon: ['fa-solid', 'fa-people-group'],
      target: num(settings.stat_beneficiaries, 12000),
      format: (v) => `${v.toLocaleString('id-ID')}+`,
      label: settings.stat_beneficiaries_label || 'Penerima Manfaat',
    },
    {
      icon: ['fa-solid', 'fa-users'],
      target: num(settings.stat_volunteers, 800),
      format: (v) => `${v.toLocaleString('id-ID')}+`,
      label: settings.stat_volunteers_label || 'Relawan Aktif',
    },
    {
      icon: ['fa-solid', 'fa-calendar-check'],
      target: num(settings.stat_years, 15),
      format: (v) => `${v.toLocaleString('id-ID')}+`,
      label: settings.stat_years_label || 'Tahun Berkhidmat',
    },
  ];

  return (
    <section className="relative z-10 border-t border-teal-700/60 bg-teal-800 shadow-inner">
      <div className="container-page grid grid-cols-2 gap-6 py-6 sm:py-8 md:py-10 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatItem key={stat.label} stat={stat} />
        ))}
      </div>
    </section>
  );
}
