import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Spinner({ size = 'md', label = 'Memuat…' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10" role="status">
      <FontAwesomeIcon icon={['fa-solid', 'fa-circle-notch']} spin className={`${sizes[size]} text-teal-700`} />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
