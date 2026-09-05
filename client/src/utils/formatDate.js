import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

/** Format tanggal Indonesia: "12 Januari 2025" */
export function formatDate(value, pattern = 'd MMMM yyyy') {
  if (!value) return '';
  return format(new Date(value), pattern, { locale: localeId });
}
