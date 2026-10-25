import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * Komponen SortTh - Kolom Header Tabel Interaktif dengan Tap to Sort
 *
 * @param {string} field - Identifier unik kolom
 * @param {string} sortField - Field yang sedang aktif disort
 * @param {'asc'|'desc'} sortOrder - Arah sort saat ini
 * @param {function} onSort - Handler saat kolom diklik (menerima field)
 * @param {'left'|'center'|'right'} align - Penjajaran teks dan ikon
 * @param {string} className - Kelas CSS tambahan
 * @param {string} title - Tooltip teks
 */
export default function SortTh({
  field,
  sortField,
  sortOrder = 'asc',
  onSort,
  children,
  align = 'left',
  className = '',
  title,
}) {
  const isActive = sortField === field;
  const isAsc = isActive && sortOrder === 'asc';
  const isDesc = isActive && sortOrder === 'desc';

  const alignClasses = {
    left: 'text-left justify-start',
    center: 'text-center justify-center',
    right: 'text-right justify-end',
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSort?.(field);
    }
  };

  const defaultTitle = typeof children === 'string'
    ? `Klik untuk mengurutkan berdasarkan ${children}`
    : 'Klik untuk mengurutkan';

  return (
    <th
      scope="col"
      role="columnheader"
      aria-sort={isActive ? (isAsc ? 'ascending' : 'descending') : 'none'}
      tabIndex={0}
      onClick={() => onSort?.(field)}
      onKeyDown={handleKeyDown}
      className={`admin-th cursor-pointer select-none group transition-colors hover:bg-slate-100/80 focus:outline-none focus:bg-slate-100 ${
        isActive ? 'text-slate-900 bg-slate-100/60 font-bold' : ''
      } ${className}`}
      title={title || defaultTitle}
    >
      <div className={`inline-flex items-center gap-1.5 w-full ${alignClasses[align] || alignClasses.left}`}>
        <span className="truncate">{children}</span>
        <span
          className={`shrink-0 inline-flex items-center justify-center transition-all ${
            isActive
              ? 'text-slate-900 scale-110'
              : 'text-slate-300 opacity-60 group-hover:opacity-100 group-hover:text-slate-600'
          }`}
        >
          {isAsc ? (
            <FontAwesomeIcon icon={['fa-solid', 'fa-sort-up']} className="text-[11px] translate-y-0.5" />
          ) : isDesc ? (
            <FontAwesomeIcon icon={['fa-solid', 'fa-sort-down']} className="text-[11px] -translate-y-0.5" />
          ) : (
            <FontAwesomeIcon icon={['fa-solid', 'fa-sort']} className="text-[10px]" />
          )}
        </span>
      </div>
    </th>
  );
}
