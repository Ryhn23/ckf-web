const VARIANT_MAP = {
  emerald: {
    badge: 'bg-slate-50 text-slate-700 border-slate-200/80',
    dot: 'bg-emerald-500',
  },
  amber: {
    badge: 'bg-slate-50 text-slate-700 border-slate-200/80',
    dot: 'bg-amber-500',
  },
  sky: {
    badge: 'bg-slate-50 text-slate-700 border-slate-200/80',
    dot: 'bg-sky-500',
  },
  rose: {
    badge: 'bg-slate-50 text-slate-700 border-slate-200/80',
    dot: 'bg-rose-500',
  },
  purple: {
    badge: 'bg-slate-50 text-slate-700 border-slate-200/80',
    dot: 'bg-slate-500',
  },
  slate: {
    badge: 'bg-slate-50 text-slate-700 border-slate-200/80',
    dot: 'bg-slate-400',
  },
};

const STATUS_ALIASES = {
  // Publikasi artikel
  PUBLISHED: { variant: 'emerald', label: 'Terbit' },
  DRAFT: { variant: 'slate', label: 'Draft' },
  ARCHIVED: { variant: 'slate', label: 'Arsip' },

  // Donasi
  PROCESSED: { variant: 'emerald', label: 'Selesai' },

  // Permohonan Bantuan
  PENDING: { variant: 'amber', label: 'Menunggu' },
  REVIEWED: { variant: 'slate', label: 'Ditinjau' },
  APPROVED: { variant: 'emerald', label: 'Disetujui' },
  REJECTED: { variant: 'rose', label: 'Ditolak' },

  // Pesan Kontak
  UNREAD: { variant: 'amber', label: 'Belum Dibaca' },
  READ: { variant: 'slate', label: 'Dibaca' },

  // User role
  ADMIN: { variant: 'slate', label: 'Admin' },
  EDITOR: { variant: 'slate', label: 'Editor' },
};

export default function StatusBadge({ status, variant, label, dot = true, className = '' }) {
  const alias = status ? STATUS_ALIASES[status] : null;
  const resolvedVariant = variant || alias?.variant || 'slate';
  const resolvedLabel = label || alias?.label || status || '—';
  const style = VARIANT_MAP[resolvedVariant] || VARIANT_MAP.slate;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${style.badge} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`}
          aria-hidden="true"
        />
      )}
      <span className="whitespace-nowrap">{resolvedLabel}</span>
    </span>
  );
}
