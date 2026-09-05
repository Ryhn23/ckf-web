# Rancangan Implementasi — Blog Yayasan (React + Express)

> Web blog untuk yayasan dengan desain modern, Font Awesome sebagai ikon, dan panel admin untuk manajemen konten berbasis kategori.

---

## 1. Arsitektur & Tech Stack

```
┌─────────────────────┐        REST API (JSON, JWT)        ┌──────────────────────┐
│   React SPA (Vite)  │  ───────────────────────────────▶  │   Express Server    │
│  Port 5173 (dev)    │  ◀───────────────────────────────── │   Port 4000         │
│  /admin (role-based)│                                    │                     │
└─────────────────────┘                                    │  ┌───────────────┐  │
                                                          │  │ Prisma ORM    │  │
                                                          │  └───────┬───────┘  │
                                                          │          ▼          │
                                                          │   PostgreSQL        │
                                                          │   uploads/ (multer) │
                                                          └──────────────────────┘
```

| Layer | Teknologi | Alasan |
|---|---|---|
| Frontend | **React 18 + Vite** | DX cepat, HMR, build produksi ringan |
| Routing | **React Router v6** | SPA routing + route guard untuk `/admin` |
| Styling | **Tailwind CSS** | Desain modern & konsisten, utility-first |
| Ikon | **Font Awesome** (`@fortawesome/react-fontawesome`) | Sesuai requirement |
| Form | **react-hook-form + zod** | Validasi form admin (post, kategori) |
| HTTP | **Axios** | Interceptor untuk JWT & error handling terpusat |
| Carousel | **Swiper.js** | Carousel landscape yang mature (autoplay, pagination, touch) |
| Editor | **react-quill** (WYSIWYG) | Konten artikel rich-text di admin |
| Backend | **Express 4** | REST API |
| ORM/DB | **Prisma + PostgreSQL** | Relasional pas untuk post↔kategori↔author |
| Auth | **JWT (httpOnly cookie) + bcryptjs** | Login admin, role-based access |
| Upload | **multer + sharp** | Upload gambar cover, resize otomatis (landscape 1600×900) |
| Proteksi API | **helmet, cors, express-rate-limit, compression** | Keamanan & performa |
| Logging | **morgan (dev) / pino (prod)** | Request log |

---

## 2. Struktur Proyek (Monorepo 2 paket)

```
ckf-web/
├── client/                        # React SPA
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx                # Router utama + Layout publik/admin
│   │   ├── api/
│   │   │   ├── client.js          # axios instance (baseURL, interceptor)
│   │   │   ├── posts.js           # getPosts, getPostBySlug, CRUD...
│   │   │   ├── categories.js
│   │   │   ├── media.js
│   │   │   └── auth.js
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx     # logo kiri, menu kanan, hamburger mobile
│   │   │   │   ├── Footer.jsx     # 4 kolom + social icons FA
│   │   │   │   └── ScrollTop.jsx  # scroll ke atas saat route berubah
│   │   │   ├── home/
│   │   │   │   ├── HeroCarousel.jsx
│   │   │   │   ├── StatsCounter.jsx
│   │   │   │   ├── AboutSection.jsx
│   │   │   │   ├── ProgramsGrid.jsx
│   │   │   │   ├── LatestPosts.jsx
│   │   │   │   ├── Testimonials.jsx
│   │   │   │   ├── CtaDonation.jsx
│   │   │   │   └── PartnersMarquee.jsx
│   │   │   ├── blog/
│   │   │   │   ├── PostCard.jsx
│   │   │   │   ├── PostList.jsx
│   │   │   │   ├── CategoryBadge.jsx
│   │   │   │   └── Pagination.jsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminLayout.jsx  # sidebar + topbar
│   │   │   │   ├── ProtectedRoute.jsx
│   │   │   │   ├── StatCard.jsx
│   │   │   │   └── ConfirmDialog.jsx
│   │   │   └── ui/                 # Button, Badge, Spinner, EmptyState...
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Programs.jsx
│   │   │   ├── BlogIndex.jsx        # listing + filter kategori + search
│   │   │   ├── BlogDetail.jsx
│   │   │   ├── Gallery.jsx
│   │   │   ├── Donate.jsx
│   │   │   ├── Contact.jsx
│   │   │   └── NotFound.jsx
│   │   ├── pages/admin/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx        # statistik + chart
│   │   │   ├── Posts.jsx            # tabel CRUD
│   │   │   ├── PostEditor.jsx       # form + quill + pilih kategori
│   │   │   ├── Categories.jsx
│   │   │   ├── Media.jsx            # media library
│   │   │   └── Settings.jsx
│   │   ├── hooks/
│   │   │   ├── useFetch.js
│   │   │   ├── useAuth.js
│   │   │   └── useCountUp.js        # animasi angka statistik
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── utils/
│   │       ├── formatDate.js
│   │       └── constants.js         # menu nav, kategori default
│   └── vite.config.js              # proxy /api → :4000 saat dev
│
├── server/                        # Express API
│   ├── src/
│   │   ├── index.js                # bootstrap express
│   │   ├── app.js                  # middleware + mount routes
│   │   ├── config/
│   │   │   ├── env.js              # validasi env (dotenv)
│   │   │   └── prisma.js           # PrismaClient singleton
│   │   ├── middlewares/
│   │   │   ├── auth.js             # verify JWT → req.user
│   │   │   ├── requireAdmin.js
│   │   │   ├── upload.js           # multer + sharp pipeline
│   │   │   ├── validate.js         # zod schema validator
│   │   │   └── errorHandler.js     # central error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── post.routes.js
│   │   │   ├── category.routes.js
│   │   │   ├── media.routes.js
│   │   │   ├── stats.routes.js
│   │   │   └── settings.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── post.controller.js
│   │   │   ├── category.controller.js
│   │   │   ├── media.controller.js
│   │   │   └── stats.controller.js
│   │   ├── services/              # business logic (pemisahan controller/service)
│   │   │   ├── post.service.js
│   │   │   ├── category.service.js
│   │   │   └── stats.service.js
│   │   ├── utils/
│   │   │   ├── slugify.js
│   │   │   ├── asyncHandler.js
│   │   │   └── ApiError.js
│   │   └── seed/
│   │       └── seed.js             # admin user + kategori default + dummy posts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── uploads/                   # hasil upload (di-serve statis)
│   └── .env.example
│
├── docker-compose.yml             # postgres lokal (opsional)
└── README.md
```

---

## 3. Skema Database (Prisma)

```prisma
enum Role { ADMIN }
enum PostStatus { DRAFT PUBLISHED }

model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  passwordHash  String
  role          Role     @default(ADMIN)
  avatar        String?
  createdAt     DateTime @default(now())
  posts         Post[]
}

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  icon        String   @default("fa-solid fa-circle") // nama ikon FA
  sortOrder   Int      @default(0)
  posts       Post[]
}

model Post {
  id           String     @id @default(cuid())
  title        String
  slug         String     @unique
  excerpt      String     // ringkasan 1–2 kalimat (untuk card)
  content      String     // HTML dari editor quill
  coverImage   String?    // path /uploads/...
  status       PostStatus @default(DRAFT)
  isFeatured   Boolean    @default(false) // tampil di carousel beranda
  publishedAt  DateTime?
  views        Int        @default(0)
  author       User       @relation(fields: [authorId], references: [id])
  authorId     String
  category     Category   @relation(fields: [categoryId], references: [id])
  categoryId   String
  tags         String[]   // array tag sederhana
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([status, publishedAt(sort: Desc)])
  @@index([categoryId])
}

model Media {
  id          String   @id @default(cuid())
  url         String   @unique
  originalName String
  size        Int
  mimeType    String
  uploadedBy  User?    @relation(fields: [uploadedById], references: [id])
  uploadedById String?
  createdAt   DateTime @default(now())
}

model Testimonial {
  id        String  @id @default(cuid())
  name      String
  role      String   // "Donatur", "Relawan"...
  quote     String
  avatar    String?
  sortOrder Int     @default(0)
}

model Setting {
  key       String   @id   // "foundation_name", "logo_url", "email"...
  value     String
}
```

**Catatan desain:**
- `Post.isFeatured` → post yang terpilih otomatis masuk **carousel beranda** (dikelola dari admin, tanpa perlu tabel carousel terpisah).
- `Setting` key-value → nama yayasan, logo, kontak, link sosial media bisa diubah dari admin tanpa deploy.
- `views` di-increment saat detail post dibuka (bisa ditambah cache/Redis nanti kalau traffic naik).

---

## 4. Desain API

### 4.1 Auth

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| POST | `/api/auth/login` | publik | `{email, password}` → JWT (httpOnly cookie) + user |
| GET | `/api/auth/me` | admin | profil user login |
| POST | `/api/auth/logout` | admin | clear cookie |

### 4.2 Posts

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| GET | `/api/posts?page=&limit=&category=&tag=&search=&status=` | publik* | listing + pagination (*`status` hanya admin) |
| GET | `/api/posts/featured` | publik | post `isFeatured` untuk carousel beranda |
| GET | `/api/posts/:slug` | publik | detail (increment views) |
| POST | `/api/posts` | admin | buat post (multipart: form + cover image) |
| PUT | `/api/posts/:id` | admin | update |
| DELETE | `/api/posts/:id` | admin | hapus (+ hapus file cover) |

**Response listing:**
```json
{
  "data": [ { "id", "title", "slug", "excerpt", "coverImage", "publishedAt", "views", "category": {"name","slug","icon"} } ],
  "meta": { "page": 1, "limit": 9, "total": 42, "totalPages": 5 }
}
```

### 4.3 Categories

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| GET | `/api/categories` | publik | semua kategori (urutan `sortOrder`) |
| POST | `/api/categories` | admin | buat `{name, description, icon}` |
| PUT | `/api/categories/:id` | admin | update |
| DELETE | `/api/categories/:id` | admin | hapus (409 jika masih punya post) |

### 4.4 Media / Lainnya

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| POST | `/api/media/upload` | admin | upload gambar → resize landscape 1600×900 via sharp |
| GET | `/api/media?page=` | admin | media library |
| DELETE | `/api/media/:id` | admin | hapus file + record |
| GET | `/api/stats/dashboard` | admin | total post, draft, views, per kategori (untuk chart) |
| GET/PUT | `/api/settings` | publik/admin | setting yayasan |
| GET | `/api/testimonials` | publik | testimoni untuk slider beranda |

**Konvensi error:**
```json
{ "error": { "code": 404, "message": "Post tidak ditemukan" } }
```

---

## 5. Desain UI — Sisi Publik

### 5.1 Navbar (sesuai requirement)

```
┌──────────────────────────────────────────────────────────────────┐
│ [LOGO Cinta Kasih Fatimah]        Beranda  Tentang  Program  Blog  Galeri  Donasi  Kontak   [🔍] │
└──────────────────────────────────────────────────────────────────┘
```

- **Kiri:** logo (gambar dari `Setting`) + nama yayasan.
- **Kanan:** menu horizontal, active state underline animasi, ikon FA kecil per menu opsional.
- **Sticky** dengan efek blur/shadow saat scroll.
- **Mobile:** hamburger → drawer slide-in dari kanan.
- CTA button "Donasi" (warna aksen) di paling kanan desktop.

### 5.2 Beranda — urutan section

```
┌──────────────────────────────────────────────────────────────┐
│ 1. HERO CAROUSEL (landscape 16:9, full-width)                │
│    - gambar post featured / banner yayasan                  │
│    - autoplay 5s, arrow kiri-kanan (FA chevron), dots        │
│    - overlay gradient + teks judul + tombol "Baca Selengkapnya"│
├──────────────────────────────────────────────────────────────┤
│ 2. STATS COUNTER (4 angka animasi)                          │
│    [fa-users] 12.000+ Penerima Manfaat                        │
│    [fa-hand-holding-heart] 350+ Program                       │
│    [fa-user-group] 800+ Relawan                               │
│    [fa-calendar-check] 15 Tahun Melayani                     │
├──────────────────────────────────────────────────────────────┤
│ 3. TENTANG KAMI (2 kolom: gambar + teks + tombol "Selengkapnya")│
├──────────────────────────────────────────────────────────────┤
│ 4. PROGRAM/KEGIATAN (grid card per kategori)                 │
│    [fa-utensils] Pendidikan   [fa-droplet] Kesehatan          │
│    [fa-hand-holding-dollar] Beasiswa  [fa-earth-asia] Sosial  │
│    → klik card = filter blog per kategori                    │
├──────────────────────────────────────────────────────────────┤
│ 5. BERITA TERBARU (grid 3 kolom PostCard + "Lihat Semua")   │
├──────────────────────────────────────────────────────────────┤
│ 6. TESTIMONI (slider Swiper, avatar + kutipan)              │
├──────────────────────────────────────────────────────────────┤
│ 7. CTA DONASI (banner gradient: "Bergabunglah menjadi bagian…")│
├──────────────────────────────────────────────────────────────┤
│ 8. PARTNER/REKAN (marquee logo)                              │
├──────────────────────────────────────────────────────────────┤
│ 9. FOOTER 4 kolom: tentang | tautan | kontak | newsletter    │
│    + bar bawah: copyright + social icons FA                  │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 Halaman Blog

- **Listing:** grid card (cover landscape, badge kategori dengan ikon FA, judul, excerpt, tanggal `date-fns`, views `fa-eye`), sidebar kanan: filter kategori (list + count), search box, post populer.
- **Detail:** breadcrumb, cover full-width, meta (author, tanggal, kategori), konten HTML, share buttons FA, related posts (kategori sama), prev/next navigasi.

### 5.4 Palet & Tipografi (modern)

| Token | Nilai |
|---|---|
| Primary | `#0F766E` (teal-700) — kesan yayasan/kemanusiaan |
| Accent | `#F59E0B` (amber-500) — CTA donasi |
| Neutral | slate-50 → slate-900 |
| Font | **Plus Jakarta Sans** (body) + **Sora/Manrope** (heading) via Google Fonts |
| Radius | `rounded-2xl` card, `rounded-full` badge |
| Shadow | `shadow-lg shadow-teal-900/5`, hover lift `-translate-y-1` |

---

## 6. Desain UI — Panel Admin (`/admin`)

### 6.1 Struktur

```
/login                      → form login (email, password, ikon FA)
/admin                     → layout: sidebar kiri + topbar
├── /admin/dashboard       → StatCard (Total Post, Draft, Views, Kategori)
│                            + bar chart views per kategori (recharts)
│                            + tabel "Post Terbaru"
├── /admin/posts           → tabel: cover thumb | judul | kategori | status | views | aksi
│                            filter: status, kategori, search; pagination
├── /admin/posts/new       → editor
├── /admin/posts/:id/edit  → editor
├── /admin/categories      → CRUD kategori (drag-sort opsional)
├── /admin/media           → grid media library + upload
└── /admin/settings        → profil yayasan, logo, kontak, sosmed
```

### 6.2 Post Editor (halaman inti)

```
┌─────────────────────────────────────────────────────────────┐
│ [fa-arrow-left] Edit Postingan                    [Draft][Publikasikan] │
├───────────────────────────────────┬─────────────────────────┤
│ Judul (input besar)               │ Kategori  [dropdown ▼]  │
│ Excerpt (textarea, 160 char)     │ Status      [radio]      │
│ ┌─────────────────────────────┐   │ Featured    [toggle]     │
│ │ Quill editor WYSIWYG        │   │ Cover Image [upload/preview]│
│ │ (bold, italic, H2, list,   │   │ Tags        [tag input]    │
│ │  quote, gambar inline)     │   │ ─────────────────────      │
│ └─────────────────────────────┘   │ Pratinjau (live excerpt) │
│                                   │                          │
└───────────────────────────────────┴─────────────────────────┘
```

- Validasi: judul ≥ 8 char, kategori wajib, cover wajib saat publish.
- Autosave draft ke `localStorage` + tombol "Simpan Draft" / "Publikasikan".
- Slug otomatis dari judul (editable), server tetap enforce unique slug.

### 6.3 Alur Auth Admin

1. `POST /api/auth/login` → bcrypt compare → JWT disimpan **httpOnly cookie** (secure, sameSite=lax).
2. `AuthContext` fetch `/auth/me` saat mount; gagal → redirect `/login`.
3. `ProtectedRoute` guard semua route `/admin/*`.
4. Axios interceptor: 401 → logout + redirect login.

---

## 7. Alur Data Utama

**A. Admin mempublish post baru**
```
PostEditor (react-hook-form + quill)
  → POST /api/posts (multipart: fields + cover.jpg)
  → multer simpan ke uploads/ → sharp resize 1600×900
  → service: slugify + cek duplikat slug
  → prisma create {status: PUBLISHED, publishedAt: now}
  → GET /api/posts/featured (beranda) otomatis menampilkan jika isFeatured
```

**B. Pengunjung membuka beranda**
```
Home.jsx mount
  → Promise.all([getFeatured(), getCategories(), getPosts({limit:6}), getTestimonials()])
  → HeroCarousel render Swiper (lazy load gambar, loading="lazy")
  → StatsCounter animasi angka saat masuk viewport (IntersectionObserver)
```

---

## 8. Keamanan & Performa

**Keamanan**
- Password bcrypt (cost 10), JWT expiry 7 hari, cookie httpOnly+secure.
- `express-rate-limit` di `/api/auth/login` (5x/menit/IP).
- Validasi input zod di semua endpoint admin; sanitize HTML quill (allowlist tag) sebelum disimpan.
- Multer: limit 5MB, whitelist mime `image/*`, rename file random (uuid).
- Helmet, CORS whitelist origin frontend, `compression`.

**Performa**
- Pagination di semua listing (default 9/12 per halaman).
- Prisma index pada `(status, publishedAt)` dan `categoryId`.
- Gambar: `loading="lazy"`, format WebP via sharp saat upload.
- Cache ringan: `Cache-Control` untuk `/uploads/*` (immutable), API publik bisa `stale-while-revalidate` 60s di header (opsional).

---

## 9. Fase Implementasi & Estimasi

| Fase | Scope | Deliverable | Estimasi |
|---|---|---|---|
| **0. Setup** | Scaffold Vite+React, Express, Prisma+Postgres, Tailwind, folder structure, env, docker-compose postgres, CI lint | repo berjalan `npm run dev` (2 terminal) | 1 hari |
| **1. Database & Seed** | schema.prisma, migration, seed (admin user, 6 kategori, 9 dummy post, testimonials, settings) | DB siap, seed idempoten | 1 hari |
| **2. API Core** | auth (login/me/logout), posts CRUD+filter+pagination, categories CRUD, media upload, stats, settings, error handler, rate limit | semua endpoint teruji via curl/Postman | 3–4 hari |
| **3. Frontend Publik — Layout** | Navbar (sticky+mobile), Footer, routing, ScrollTop, 404 | kerangka situs navigasi berfungsi | 1–2 hari |
| **4. Beranda** | HeroCarousel (Swiper), StatsCounter, About, ProgramsGrid, LatestPosts, Testimonials, CTA, Partners, newsletter form | beranda lengkap responsif | 2–3 hari |
| **5. Blog Publik** | listing+filter+search+pagination, detail post, related posts, share buttons | blog publik selesai | 2 hari |
| **6. Admin — Auth & Layout** | login page, AuthContext, ProtectedRoute, AdminLayout (sidebar+topbar) | area admin terproteksi | 1–2 hari |
| **7. Admin — Posts** | tabel posts, editor (quill, kategori, cover upload, featured, tags), draft/publish flow | CRUD post lengkap | 3 hari |
| **8. Admin — Sisanya** | categories CRUD, media library, dashboard stats+chart, settings | admin panel selesai | 2–3 hari |
| **9. Polish & Deploy** | responsive audit, empty/loading/error states, SEO meta (react-helmet-async), build, deploy (Vercel/Netlify + Railway/Render/Fly untuk API+DB) | produksi live | 1–2 hari |

**Total: ± 3–4 minggu kerja penuh (1 dev), atau ± 2 minggu (2 dev paralel: API & UI).**

---

## 10. Keputusan yang Perlu Dikonfirmasi

1. **Database:** PostgreSQL (rekomendasi) vs MongoDB?
2. **Hosting:** VPS sendiri / cloud (Railway, Render, Fly.io) / shared hosting (butang Node)?
3. **Nama yayasan & identitas** (warna brand, logo) — untuk seed `Setting` dan palet final.
4. **Kategori default** yang diinginkan (default saya: Pendidikan, Kesehatan, Beasiswa, Sosial, Kegiatan Internal, Pengumuman).
5. Apakah butuh **halaman donasi fungsional** (integrasi payment gateway) atau cukup CTA + info rekening?
