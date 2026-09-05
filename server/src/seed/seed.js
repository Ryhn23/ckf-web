/**
 * Seed idempoten: admin user, kategori, post dummy (dengan cover image),
 * testimonials, dan settings yayasan.
 *
 * Jalankan: npm run seed -w server
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import prisma from '../config/prisma.js';
import env from '../config/env.js';
import slugify from '../utils/slugify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '..', '..', env.uploadDir);
const SEED_DIR = path.join(UPLOAD_DIR, 'seed');

/* ------------------------------------------------------------------ */
/* Data                                                               */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { name: 'Pendidikan', slug: 'pendidikan', icon: 'fa-solid fa-graduation-cap', description: 'Program pendidikan dan literasi' },
  { name: 'Kesehatan', slug: 'kesehatan', icon: 'fa-solid fa-heart-pulse', description: 'Kegiatan kesehatan masyarakat' },
  { name: 'Beasiswa', slug: 'beasiswa', icon: 'fa-solid fa-hand-holding-dollar', description: 'Penyaluran beasiswa pendidikan' },
  { name: 'Sosial', slug: 'sosial', icon: 'fa-solid fa-earth-asia', description: 'Kegiatan sosial & lingkungan' },
  { name: 'Kegiatan Internal', slug: 'kegiatan-internal', icon: 'fa-solid fa-users', description: 'Aktivitas internal yayasan' },
  { name: 'Pengumuman', slug: 'pengumuman', icon: 'fa-solid fa-bullhorn', description: 'Informasi resmi yayasan' },
];

const POSTS = [
  {
    title: 'Pembukaan 120 Beasiswa Pendidikan untuk Anak Keluarga Prasejahtera',
    category: 'beasiswa',
    featured: true,
    daysAgo: 2,
    views: 1240,
    tags: ['beasiswa', 'pendidikan', '2026'],
    excerpt:
      'Cinta Kasih Fatimah resmi membuka pendaftaran 120 beasiswa penuh untuk anak usia sekolah dari keluarga prasejahtera di tiga kabupaten.',
    cover: ['#0f766e', '#134e4a'],
    content: [
      'p:Cinta Kasih Fatimah pada hari ini secara resmi membuka pendaftaran program beasiswa pendidikan tahun ajaran 2026/2027. Tahun ini yayasan mengalokasikan 120 beasiswa penuh yang mencakup biaya sekolah, buku, seragam, dan kebutuhan belajar lainnya.',
      'p:Beasiswa ini ditujukan bagi anak usia sekolah dari keluarga prasejahtera di tiga kabupaten yang menjadi wilayah kerja yayasan. Para penerima akan didampingi oleh mentor relawan hingga menyelesaikan jenjang pendidikannya.',
      'h2:Cara Pendaftaran',
      'ul:Pendaftaran dilakukan melalui sekolah masing-masing atau kantor kecamatan terdekat.',
      'ul:Siapkan fotokopi KK, rapor dua semester terakhir, dan surat keterangan tidak mampu dari kelurahan.',
      'ul:Seleksi administrasi akan diumumkan pada akhir bulan ini.',
      'p:Kami berharap program ini kembali menjangkau anak-anak yang selama ini tertahan mimpinya karena keterbatasan biaya. Donasi Anda adalah jembatan bagi mereka untuk terus bersekolah.',
    ],
  },
  {
    title: 'Klinik Keliling CKF Sapa Lima Desa Terpencil di Pesisir Selatan',
    category: 'kesehatan',
    featured: false,
    daysAgo: 5,
    views: 860,
    tags: ['kesehatan', 'klinikkling'],
    excerpt:
      'Selama tiga hari, tim medis relawan CKF memeriksa lebih dari 400 warga di lima desa yang hanya bisa diakses perahu.',
    cover: ['#0e7490', '#155e75'],
    content: [
      'p:Tim medis relawan Cinta Kasih Fatimah bersama dua dokter dan empat perawat menjangkau lima desa terpencil di pesisir selatan. Perjalanan menuju desa terakhir memakan waktu hampir empat jam dengan perahu penyeberangan.',
      'p:Sebanyak 412 warga diperiksa, mulai dari balita hingga lansia. Masalah yang paling banyak ditemukan adalah infeksi saluran pernapasan akut dan gangguan kulit akibat lingkungan pesisir.',
      'h2:Hasil Kegiatan',
      'ul:412 pasien diperiksa, 38 dirujuk ke puskesmas dengan pendampingan tim CKF.',
      'ul:Distribusi obat gratis senilai Rp 25 juta untuk kebutuhan tiga bulan ke depan.',
      'ul:Pembentukan posko kesehatan desa bersama kader kesehatan setempat.',
      'p:Kegiatan ini menjadi bukti bahwa akses kesehatan yang layak bukan hanya hak, tetapi juga tanggung jawab bersama. Terima kasih kepada seluruh donatur dan relawan yang membuat perjalanan ini mungkin.',
    ],
  },
  {
    title: 'Program Perpustakaan Bergerak: 40 Buku Baru untuk Sekolah Pedalaman',
    category: 'pendidikan',
    featured: false,
    daysAgo: 9,
    views: 640,
    tags: ['literasi', 'sekolah'],
    excerpt:
      'Empat sekolah pedalaman kini memiliki koleksi buku bacaan baru hasil penggalangan buku dari para donatur.',
    cover: ['#4d7c0f', '#3f6212'],
    content: [
      'p:Program Perpustakaan Bergerang kembali membawa kabar baik. Sebanyak 40 buku cerita dan buku pengetahuan baru telah didistribusikan ke empat sekolah dasar di wilayah pedalaman.',
      'p:Buku-buku ini merupakan hasil penggalangan dari para donatur yang menyisihkan buku bacaan mereka. Seluruh buku melewati kurasi tim pendidikan yayasan agar sesuai dengan usia dan kurikulum peserta didik.',
      'h2:Kegiatan Pendamping',
      'ul:Sesi membaca bersama bersama guru kelas setiap Jumat.',
      'ul:Pelatihan sederhana pengelolaan perpustakaan mini untuk guru.',
      'p:Kami percaya bahwa satu buku yang tepat di tangan anak yang tepat dapat mengubah arah hidupnya. Terus kirimkan buku Anda, dan kami akan mengantarkannya sampai ke desa-desa yang membutuhkan.',
    ],
  },
  {
    title: 'Bakti Sosial Pembersihan Pantai dan Penanaman Seribu Bibit Mangrove',
    category: 'sosial',
    featured: true,
    daysAgo: 12,
    views: 1520,
    tags: ['lingkungan', 'mangrove', 'relawan'],
    excerpt:
      'Ratusan relawan dan warga bahu membahu membersihkan pantai sekaligus menanam seribu bibit mangrove.',
    cover: ['#047857', '#065f46'],
    content: [
      'p:Lebih dari 200 relawan bersama warga setempat berkumpul di pesisir untuk kegiatan pembersihan pantai dan penanaman mangrove. Kegiatan ini menjadi agenda bulanan yayasan sebagai bentuk kepedulian terhadap lingkungan pesisir.',
      'p:Sebanyak seribu bibit mangrove ditanam di sepanjang dua kilometer pantai. Selain berfungsi menahan abrasi, hutan mangrove juga menjadi habitat biota laut yang menopang mata pencaharian nelayan sekitar.',
      'h2:Dampak Jangka Panjang',
      'ul:Pengurangan abrasi dan perlindungan tambak warga dari intrusi air laut.',
      'ul:Penurunan sampah plastik di zona intertidal hingga 60% pada area program.',
      'ul:Pembentukan kelompok konservasi pantai yang mandiri.',
      'p:Terima kasih untuk seluruh relawan yang meluangkan akhir pekannya. Lingkungan yang sehat adalah warisan terbaik yang bisa kita tinggalkan bagi generasi berikutnya.',
    ],
  },
  {
    title: 'Pelatihan Kewirausahaan untuk 200 Ibu Rumah Tangga Berhasil Tuntas',
    category: 'pendidikan',
    featured: false,
    daysAgo: 16,
    views: 480,
    tags: ['kewirausahaan', 'pelatihan'],
    excerpt:
      'Dua ratus ibu rumah tangga menyelesaikan pelatihan keterampilan usaha kecil dan pemasaran digital.',
    cover: ['#b45309', '#92400e'],
    content: [
      'p:Program pelatihan kewirausahaan angkatan ketiga resmi ditutup. Dua ratus peserta dari berbagai desa menyelesaikan rangkaian materi mulai dari dasar usaha, pengelolaan keuangan rumah tangga, hingga pemasaran melalui media sosial.',
      'p:Sebanyak 30 kelompok usaha telah terbentuk dan mulai memproduksi produk unggulan masing-masing desa, mulai dari keripik singkong, kerajinan anyaman, hingga olahan hasil laut.',
      'h2:Lanjutan Program',
      'ul:Pendampingan usaha selama enam bulan oleh mentor relawan.',
      'ul:Akses modal sosial bagi kelompok yang lolos kurasi.',
      'p:Kami optimis pelatihan ini menjadi titik awal kemandirian ekonomi keluarga. Cerita mereka adalah bukti bahwa pemberdayaan yang tepat sasaran akan tumbuh menjadi perubahan nyata.',
    ],
  },
  {
    title: 'Pengumuman: Pendaftaran Relawan Batch 12 Resmi Dibuka',
    category: 'pengumuman',
    featured: true,
    daysAgo: 1,
    views: 980,
    tags: ['relawan', 'pengumuman'],
    excerpt:
      'Cinta Kasih Fatimah membuka pendaftaran relawan batch 12 untuk posisi pendamping pendidikan, medis, dan logistik.',
    cover: ['#7c3aed', '#5b21b6'],
    content: [
      'p:Cinta Kasih Fatimah dengan senang hati mengumumkan pembukaan pendaftaran relawan batch 12. Kami mencari individu yang siap berkomitmen minimal enam bulan untuk mendampingi program yayasan di lapangan.',
      'p:Tiga posisi yang dibuka adalah pendamping pendidikan, asisten medis, dan koordinator logistik. Seluruh relawan akan mengikuti orientasi dua hari sebelum bertugas di wilayah program.',
      'h2:Informasi Penting',
      'ul:Periode pendaftaran ditutup pada akhir bulan ini atau bila kuota terpenuhi.',
      'ul:Prioritas diberikan kepada pelamar yang berdomisili dekat wilayah program.',
      'ul:Kirimkan CV dan surat motivasi melalui formulir pendaftaran di halaman kontak.',
      'p:Menjadi relawan berarti menjadi bagian dari perubahan. Kami menantikan kehadiran Anda di keluarga besar CKF.',
    ],
  },
  {
    title: 'Dapur Umum CKF Sediakan 500 Porsi Nasi per Hari untuk Pekerja Migran',
    category: 'sosial',
    featured: false,
    daysAgo: 20,
    views: 720,
    tags: ['dapur-umum', 'kemanusiaan'],
    excerpt:
      'Dapur umum yayasan kini melayani 500 porsi nasi hangat setiap hari untuk pekerja migran dan warga sekitar.',
    cover: ['#be123c', '#9f1239'],
    content: [
      'p:Dapur umum Cinta Kasih Fatimah yang berlokasi di pusat kota kini melayani 500 porsi nasi hangat setiap hari. Porsi tersebut didistribusikan untuk pekerja migran, buruh harian, dan warga sekitar yang membutuhkan.',
      'p:Operasional dapur ditangani oleh tim relawan bergantian bersama ibu-ibu PKK setempat. Bahan baku utama disuplai langsung dari pasar induk dengan harga khusus program.',
      'h2:Dukungan yang Dibutuhkan',
      'ul:Bantuan bahan pokok harian untuk menjaga konsistensi layanan.',
      'ul:Relawan dapur untuk shift pagi dan siang.',
      'p:Setiap porsi nasi yang tersaji adalah bentuk kepedulian kita terhadap sesama. Dukungan Anda, sekecil apa pun, berarti besar bagi mereka yang menerima.',
    ],
  },
  {
    title: 'Workshop Pertolongan Pertama Dasar untuk Guru-Guru Desa',
    category: 'kesehatan',
    featured: false,
    daysAgo: 24,
    views: 350,
    tags: ['pertolongan-pertama', 'pelatihan'],
    excerpt:
      'Empat puluh guru desa mengikuti workshop pertolongan pertama dasar agar siap menghadapi kondisi darurat di sekolah.',
    cover: ['#0369a1', '#075985'],
    content: [
      'p:Sebanyak 40 guru dari berbagai sekolah desa mengikuti workshop pertolongan pertama dasar yang difasilitasi yayasan bersama tim medis. Materi mencakup penanganan pingsan, luka berdarah, hingga tatalaksana awal demam tinggi pada anak.',
      'p:Para guru dipilih sebagai agen perubahan karena mereka adalah orang dewasa yang paling sering berada di dekat anak-anak saat kondisi darurat terjadi di lingkungan sekolah.',
      'h2:Langkah Selanjutnya',
      'ul:Pembentukan tim siaga darurat di setiap sekolah binaan.',
      'ul:Penyediaan kotak P3K lengkap dan alat AED sederhana di posko sekolah.',
      'p:Keberanian dan kemampuan menolong di saat yang tepat dapat menyelamatkan nyawa. Kami berharap para guru menjadi garda pertama keselamatan anak-anak di desanya.',
    ],
  },
  {
    title: 'Rapat Kerja Internal: Menata Program Kemanusiaan 2026',
    category: 'kegiatan-internal',
    featured: false,
    daysAgo: 30,
    views: 210,
    tags: ['internal', 'program'],
    excerpt:
      'Seluruh divisi yayasan berkumpul merumuskan prioritas program kemanusiaan dan target dampak tahun ini.',
    cover: ['#475569', '#334155'],
    content: [
      'p:Cinta Kasih Fatimah menggelar rapat kerja internal dua hari untuk menata kembali peta program kemanusiaan tahun ini. Seluruh kepala divisi, koordinator wilayah, dan perwakilan relawan hadir dalam forum tersebut.',
      'p:Fokus utama tahun ini adalah pendalaman dampak: bukan sekadar menambah jumlah kegiatan, tetapi memastikan setiap program yang berjalan benar-benar berkelanjutan dan terukur.',
      'h2:Tiga Prioritas Tahun Ini',
      'ul:Penguatan program beasiswa dengan sistem pendampingan mentor.',
      'ul:Ekspansi klinik keliling ke dua kabupaten baru.',
      'ul:Digitalisasi pelaporan dampak untuk transparansi donatur.',
      'p:Rapat kerja ini menjadi momentum menyegarkan komitmen bersama. Dengan arah yang jelas, langkah kecil kita hari ini akan menjadi perubahan besar esok hari.',
    ],
  },
];

const TESTIMONIALS = [
  {
    name: 'Siti Aminah',
    role: 'Donatur',
    quote:
      'Saya sudah tiga tahun rutin berdonasi melalui CKF. Yang membuat saya bertahan adalah laporan dampaknya yang transparan — saya tahu uang saya sampai ke mana.',
  },
  {
    name: 'Budi Santoso',
    role: 'Relawan Pendamping Pendidikan',
    quote:
      'Menjadi relawan CKF mengubah cara saya melihat pendidikan. Melihat anak-anak yang dulu malu ke sekolah kini percaya diri presentasi di depan kelas adalah hal yang tak ternilai.',
  },
  {
    name: 'Rina Wati',
    role: 'Penerima Beasiswa',
    quote:
      'Tanpa beasiswa CKF, saya mungkin sudah berhenti di SMP. Sekarang saya kuliah sambil menjadi tutor untuk adik-adik saya. Saya ingin membalas kebaikan ini.',
  },
];

const SETTINGS = [
  ['foundation_name', 'Cinta Kasih Fatimah'],
  ['tagline', 'Membangun masa depan melalui pendidikan dan kemanusiaan'],
  ['about_text', 'Cinta Kasih Fatimah berdiri sejak 2011 dengan misi menghadirkan akses pendidikan, kesehatan, dan kesempatan ekonomi yang layak bagi masyarakat prasejahtera. Melalui program beasiswa, klinik keliling, dapur umum, dan pemberdayaan ekonomi, kami percaya perubahan besar dimulai dari langkah kecil yang konsisten.'],
  ['email', 'info@ckf.or.id'],
  ['phone', '+62 812-3456-7890'],
  ['address', 'Jl. Merdeka No. 123, Jakarta'],
  ['social_facebook', 'https://facebook.com/ckf'],
  ['social_instagram', 'https://instagram.com/ckf'],
  ['social_youtube', 'https://youtube.com/@ckf'],
  ['social_x', 'https://x.com/ckf'],
  ['stat_beneficiaries', '12000'],
  ['stat_programs', '350'],
  ['stat_volunteers', '800'],
  ['stat_years', '15'],
  ['donation_bank_name', 'Bank Harapan'],
  ['donation_account_number', '1234567890 a.n. Cinta Kasih Fatimah'],
];

/* ------------------------------------------------------------------ */
/* Helper                                                             */
/* ------------------------------------------------------------------ */

const escapeXml = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

function coverSvg(title, [from, to]) {
  const short = title.length > 60 ? title.slice(0, 57) + '…' : title;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#g)"/>
  <circle cx="1350" cy="180" r="260" fill="#ffffff" opacity="0.08"/>
  <circle cx="220" cy="760" r="340" fill="#ffffff" opacity="0.06"/>
  <text x="100" y="470" font-family="DejaVu Sans, sans-serif" font-size="88" font-weight="bold" fill="#ffffff">${escapeXml(short)}</text>
  <text x="100" y="580" font-family="DejaVu Sans, sans-serif" font-size="44" fill="#ffffff" opacity="0.75">Cinta Kasih Fatimah</text>
</svg>`;
}

async function ensureCover(slug, title, colors) {
  fs.mkdirSync(SEED_DIR, { recursive: true });
  const file = path.join(SEED_DIR, `${slug}.webp`);
  if (!fs.existsSync(file)) {
    await sharp(Buffer.from(coverSvg(title, colors))).webp({ quality: 82 }).toFile(file);
  }
  return `/uploads/seed/${path.basename(file)}`;
}

const daysAgoDate = (n) => new Date(Date.now() - n * 86_400_000);

/* ------------------------------------------------------------------ */
/* Seed                                                               */
/* ------------------------------------------------------------------ */

async function seed() {
  console.log('▶ Memulai seed…');

  // Admin user
  const adminEmail = 'admin@ckf.or.id';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Administrator',
      email: adminEmail,
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  });
  console.log(`✔ Admin: ${admin.email} (password: admin123${existingAdmin ? ' — sudah ada' : ''})`);

  // Categories
  const categoryMap = {};
  for (const [i, cat] of CATEGORIES.entries()) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, description: cat.description, sortOrder: i },
      create: { ...cat, sortOrder: i },
    });
    categoryMap[cat.slug] = c;
  }
  console.log(`✔ Kategori: ${CATEGORIES.length} kategori`);

  // Posts + covers
  for (const p of POSTS) {
    const coverImage = await ensureCover(slugify(p.title), p.title, p.cover);
    const publishedAt = daysAgoDate(p.daysAgo);
    const html = p.content
      .map((line) => {
        const [kind, ...rest] = line.split(':');
        const text = rest.join(':');
        if (kind === 'h2') return `<h2>${text}</h2>`;
        if (kind === 'ul') return `<li>${text}</li>`;
        return `<p>${text}</p>`;
      })
      .join('\n');
    const wrapped = wrapLists(html);

    await prisma.post.upsert({
      where: { slug: slugify(p.title) },
      update: {
        title: p.title,
        excerpt: p.excerpt,
        content: wrapped,
        coverImage,
        status: 'PUBLISHED',
        isFeatured: p.featured,
        publishedAt,
        views: p.views,
        tags: p.tags,
        categoryId: categoryMap[p.category].id,
        authorId: admin.id,
      },
      create: {
        title: p.title,
        slug: slugify(p.title),
        excerpt: p.excerpt,
        content: wrapped,
        coverImage,
        status: 'PUBLISHED',
        isFeatured: p.featured,
        publishedAt,
        views: p.views,
        tags: p.tags,
        categoryId: categoryMap[p.category].id,
        authorId: admin.id,
      },
    });
  }
  console.log(`✔ Post: ${POSTS.length} post (${POSTS.filter((p) => p.featured).length} featured)`);

  // Testimonials
  for (const t of TESTIMONIALS) {
    await prisma.testimonial.upsert({
      where: { id: `seed-${slugify(t.name)}` },
      update: { name: t.name, role: t.role, quote: t.quote },
      create: { id: `seed-${slugify(t.name)}`, ...t, sortOrder: TESTIMONIALS.indexOf(t) },
    });
  }
  console.log(`✔ Testimonial: ${TESTIMONIALS.length} item`);

  // Settings
  for (const [key, value] of SETTINGS) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log(`✔ Settings: ${SETTINGS.length} key`);

  console.log('✅ Seed selesai.');
}

/** Bungkus rangkaian <li> menjadi <ul>…</ul>. */
function wrapLists(html) {
  return html.replace(/(?:^|\n)(<li>[\s\S]*?<\/li>(?:\n<li>[\s\S]*?<\/li>)*)/g, (m, lists) => `\n<ul>\n${lists}\n</ul>`);
}

seed()
  .catch((err) => {
    console.error('❌ Seed gagal:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
