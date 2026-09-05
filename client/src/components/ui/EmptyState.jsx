import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function EmptyState({ icon = 'fa-inbox', title = 'Belum ada data', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-xl text-teal-700">
        <FontAwesomeIcon icon={['fa-solid', icon]} />
      </span>
      <div>
        <p className="font-semibold text-slate-800">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
