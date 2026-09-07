/**
 * Utilitas untuk standardisasi dan parsing ikon Font Awesome.
 */

export function parseFaIcon(iconStr, defaultIcon = ['fa-solid', 'fa-circle']) {
  if (!iconStr || typeof iconStr !== 'string') return defaultIcon;
  const parts = iconStr.trim().split(/\s+/);
  if (parts.length >= 2) {
    return [parts[0], parts[1]];
  }
  const single = parts[0];
  if (single.startsWith('fa-')) {
    return ['fa-solid', single];
  }
  return ['fa-solid', `fa-${single}`];
}

export const CATEGORY_ICON_PRESETS = [
  { label: 'Pendidikan', icon: 'fa-solid fa-graduation-cap' },
  { label: 'Literasi / Buku', icon: 'fa-solid fa-book-open' },
  { label: 'Kesehatan', icon: 'fa-solid fa-heart-pulse' },
  { label: 'Beasiswa', icon: 'fa-solid fa-hand-holding-dollar' },
  { label: 'Sosial & Alam', icon: 'fa-solid fa-earth-asia' },
  { label: 'Keluarga & Anak', icon: 'fa-solid fa-people-roof' },
  { label: 'Relawan & Komunitas', icon: 'fa-solid fa-users' },
  { label: 'Pengumuman / Rilis', icon: 'fa-solid fa-bullhorn' },
  { label: 'Advokasi / Hukum', icon: 'fa-solid fa-scale-balanced' },
  { label: 'Perlindungan', icon: 'fa-solid fa-shield-heart' },
];
