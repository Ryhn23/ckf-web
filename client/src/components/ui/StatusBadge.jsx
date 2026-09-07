const VARIANT_MAP = {
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
  },
  sky: {
    badge: 'bg-sky-50 text-sky-700 border-sky-200/80',
    dot: 'bg-sky-500',
  },
  rose: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dot: 'bg-rose-500',
  },
  purple: {
    badge: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dot: 'bg-purple-500',
  },
  slate: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
};

const STATUS_ALIASES = {
  // Publikasi artikel
  PUBLISHED: { variant: 'emerald', label: 'Terbit' },
  DRAFT: { variant: 'amber', label: 'Draf' },
  ARCHIVED: { variant: 'slate', label: 'Arsip' },

  // Donasi
  PROCESSED: { variant: 'emerald', label: 'Terverifikasi' },

  // Permohonan Bantuan
  PENDING: { variant: 'amber', label: 'Menunggu Verifikasi' },
  REVIEWED: { variant: 'sky', label: 'Sedang Ditinjau' },
  APPROVED: { variant: 'emerald', label: 'Disetujui' },
  REJECTED: { variant: 'rose', label: 'Ditolak' },

  // Pesan Kontak
  UNREAD: { variant: 'sky', label: 'Belum Dibaca' },
  READ: { variant: 'slate', label: 'Sudah Dibaca' },

  // User role
  ADMIN: { variant: 'purple', label: 'Administrator' },
  EDITOR: { variant: 'sky', label: 'Editor' },
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
