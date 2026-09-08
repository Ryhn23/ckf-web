/** Menu navigasi utama (navbar + footer). */
export const NAV_ITEMS = [
  { label: 'Beranda', path: '/' },
  { label: 'Tentang', path: '/tentang' },
  { label: 'Program', path: '/program' },
  { label: 'Blog', path: '/blog' },
  { label: 'Galeri', path: '/galeri' },
  { label: 'Donasi', path: '/donasi' },
  { label: 'Kontak', path: '/kontak' },
];

/** Ikon Font Awesome untuk kategori (fallback). */
export const CATEGORY_ICONS = [
  'fa-solid fa-graduation-cap',
  'fa-solid fa-heart-pulse',
  'fa-solid fa-hand-holding-dollar',
  'fa-solid fa-earth-americas',
  'fa-solid fa-house-circle-check',
  'fa-solid fa-bullhorn',
  'fa-solid fa-circle',
];

/** Pilihan ikon untuk form kategori di admin. */
export const ICON_CHOICES = [
  { value: 'fa-solid fa-graduation-cap', label: 'Pendidikan (topi toga)' },
  { value: 'fa-solid fa-heart-pulse', label: 'Kesehatan (detak jantung)' },
  { value: 'fa-solid fa-hand-holding-dollar', label: 'Beasiswa (uang)' },
  { value: 'fa-solid fa-earth-americas', label: 'Sosial (bumi)' },
  { value: 'fa-solid fa-house-circle-check', label: 'Kegiatan Internal (rumah)' },
  { value: 'fa-solid fa-bullhorn', label: 'Pengumuman (corong)' },
  { value: 'fa-solid fa-hand-holding-heart', label: 'Donasi (tangan & hati)' },
  { value: 'fa-solid fa-utensils', label: 'Kemanusiaan (makanan)' },
  { value: 'fa-solid fa-circle', label: 'Umum (titik)' },
];
