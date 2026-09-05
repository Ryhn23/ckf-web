# Cinta Kasih Fatimah (CKF Web)

Platform web publik dan panel administrasi untuk **Yayasan Cinta Kasih Fatimah**: portal berita/blog program kemanusiaan dengan rich-text editor, galeri kegiatan, statistik dampak, formulir donasi & kontak terintegrasi, serta manajemen pengaturan yayasan dinamis.

**Tech Stack:** React 18 (Vite) · Express.js · Prisma ORM · PostgreSQL 15 · Tailwind CSS · Nginx · Docker & Docker Compose

---

## 🚀 Cara Menjalankan Aplikasi

Tersedia dua opsi: **Docker Compose** (otomatis & direkomendasikan) atau **Manual (Local Dev)**.

### Opsi A: Docker Compose (Otomatis — Sekali Perintah)

Sangat direkomendasikan karena otomatis menyalakan PostgreSQL, menunggu database siap, mensinkronkan skema Prisma, melakukan **seeding data awal**, menyalakan Backend API, dan menyajikan Frontend SPA via Nginx:

```bash
# Jalankan seluruh stack (Database + Backend + Frontend + Auto Seed)
docker compose up -d
```

Setelah perintah selesai, akses:
- 🌐 **Situs Publik:** [http://localhost:5173](http://localhost:5173) atau [http://localhost](http://localhost)
- 🔐 **Panel Admin:** [http://localhost:5173/admin/login](http://localhost:5173/admin/login)
- ⚙️ **Backend API (Direct):** [http://localhost:4000](http://localhost:4000) (atau via proxy [http://localhost:5173/api](http://localhost:5173/api))
- 🗄️ **PostgreSQL:** `localhost:5433` (DB: `ckf_blog`, User: `postgres`, Pass: `postgres`)

**Kredensial Admin Default (Hasil Seed):**
- **Email:** `admin@ckf.or.id`
- **Password:** `admin123`

---

### Opsi B: Local Development (Manual via Node.js)

**Prasyarat:** Node.js ≥ 20, npm, Docker (untuk DB lokal).

```bash
# 1. Install seluruh dependensi (root, client, server)
npm run setup

# 2. Nyalakan database PostgreSQL di background (port 5433)
docker compose up -d db

# 3. Sinkronkan skema database
npm run migrate

# 4. Jalankan seed data awal
npm run seed

# 5. Jalankan API (:4000) dan Vite Dev Server (:5173) secara bersamaan
npm run dev
```

---

## 📋 Daftar Script NPM (Root)

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run setup` | Install dependensi di root dan semua workspace (`client` + `server`) |
| `npm run dev` | Menjalankan backend (:4000) dan frontend (:5173) secara concurrent |
| `npm run dev:server` | Menjalankan hanya backend Express dengan nodemon |
| `npm run dev:client` | Menjalankan hanya frontend Vite dev server |
| `npm run migrate` | Menjalankan migrasi Prisma pada server |
| `npm run seed` | Menjalankan skrip seed data awal secara idempoten |
| `npm run build` | Mem-build bundle frontend produksi ke `client/dist` |

---

## 🛠️ Perbaikan & Optimasi Terbaru

1. **Otomatisasi Penuh Docker Compose**:
   - `server/docker-entrypoint.sh`: Otomatis menunggu kesiapan TCP PostgreSQL, melakukan `prisma db push`, menjalankan `seed.js` idempoten, dan boot Express server.
   - `client/Dockerfile` & `client/nginx.conf`: Multi-stage build dengan Nginx reverse proxy untuk `/api` dan `/uploads` (`^~` priority rules), kompresi Gzip, caching, SPA fallback, serta dukungan IPv4/IPv6.
2. **Perbaikan Hidrasi Settings (`SettingsContext.jsx`)**: Mengatasi kegagalan hidrasi setting yayasan (nama, kontak, sosmed, rekening) akibat path data yang salah (`res.data?.data` → `res?.data || res`).
3. **Perbaikan Rendering Icon (`Footer.jsx` & `fa-icons.js`)**: Memperbaiki pemanggilan ikon kategori dan mendaftarkan ikon FontAwesome yang hilang (`faCompass`, `faGlobe`, `faHeart`, `faSpinner`, `faLinkedin`, `faTelegram`, `faTiktok`, `faTwitter`, dll).
4. **Testimonial Dinamis (`Testimonials.jsx`)**: Terhubung langsung ke API `/api/testimonials` dengan penanganan avatar dan fallback.
5. **Code-Splitting Modul Admin (`App.jsx`)**: Menggunakan `React.lazy()` & `<Suspense>` untuk semua halaman admin, memangkas ukuran bundle awal dari **~1.2 MB** menjadi **~530 KB** (>55% lebih ringan & cepat).

---

## 📂 Struktur Proyek

```text
├── docker-compose.yml        # Orkestrasi multi-kontainer: db, backend, frontend
├── package.json              # Konfigurasi npm workspaces (client & server)
├── client/                   # Frontend React SPA (Vite + Tailwind CSS)
│   ├── Dockerfile            # Multi-stage build (Node Alpine -> Nginx Alpine)
│   ├── nginx.conf            # Reverse proxy /api & /uploads, SPA fallback & caching
│   └── src/
│       ├── api/              # Axios client & service wrapper per resource
│       ├── components/       # Layout, Navbar, Footer, Home, Blog, UI reusable
│       ├── context/          # AuthContext (JWT auth), SettingsContext
│       ├── pages/
│       │   ├── (publik)      # Home, About, Programs, BlogIndex, BlogDetail, Gallery, Donate, Contact
│       │   └── admin/        # Dashboard, Posts, Editor, Categories, Media, Donations, Contact, Users, Settings
│       └── lib/fa-icons.js   # Registrasi pustaka ikon FontAwesome
└── server/                   # Backend Express API (Node.js ESM)
    ├── Dockerfile            # Node 20 Bookworm Slim (dengan dukungan OpenSSL & Sharp)
    ├── docker-entrypoint.sh  # Script auto-wait DB, auto schema push, auto seed
    ├── prisma/
    │   └── schema.prisma     # Model DB: User, Category, Post, Media, Testimonial, Setting, Donation, ContactMessage
    └── src/
        ├── config/           # env.js, prisma.js
        ├── controllers/      # Logika bisnis per modul
        ├── middlewares/      # auth (JWT cookie), rateLimiter, validate (zod), error handler
        ├── routes/           # Routing modular /api/*
        ├── seed/seed.js      # Generator data awal idempoten + SVG cover generator
        └── utils/            # ApiError, asyncHandler, jwt, file upload helper
```

---

## 🔌 Ringkasan Endpoint API

Base URL: `http://localhost:5173/api` (atau `http://localhost:4000/api`).  
Format Respons: Sukses `{ "data": ... }` | Error `{ "error": { "code", "message" } }`.

### 1. Autentikasi & Pengguna
- `POST /api/auth/login` — Login user/admin (mengembalikan JWT via `httpOnly` cookie).
- `GET /api/auth/me` — Cek status profil pengguna yang sedang login.
- `POST /api/auth/logout` — Hapus session/cookie.
- `GET/POST/PUT/DELETE /api/users` 🔒 — Manajemen pengguna admin.

### 2. Postingan & Kategori Blog
- `GET /api/posts` — Daftar artikel terbit (dukungan query: `page, limit, category, q, sort`).
- `GET /api/posts/featured` — Daftar 3 artikel unggulan (*featured*).
- `GET /api/posts/:slug` — Detail artikel publik + auto increment views.
- `POST/PUT/DELETE /api/posts` 🔒 — Operasi CRUD artikel (dukungan cover image WebP).
- `GET /api/categories` — Daftar semua kategori program/kegiatan.
- `POST/PUT/DELETE /api/categories` 🔒 — CRUD kategori.

### 3. Media & Galeri
- `GET /api/media/public` — Daftar galeri foto kegiatan untuk publik.
- `GET/DELETE /api/media` 🔒 — Manajemen file media untuk admin.
- `POST /api/media/upload` 🔒 — Upload gambar (auto resize & convert WebP via sharp).

### 4. Donasi, Kontak & Pengaturan
- `POST /api/donations` — Pengiriman formulir konfirmasi donasi publik.
- `GET/PATCH/DELETE /api/donations` 🔒 — Manajemen data donasi masuk.
- `POST /api/contact-messages` — Pengiriman pesan formulir kontak publik.
- `GET/PATCH/DELETE /api/contact-messages` 🔒 — Manajemen pesan masuk.
- `GET /api/testimonials` — Daftar testimoni penerima manfaat/donatur.
- `GET /api/settings` — Pengaturan identitas yayasan publik.
- `PUT /api/settings` 🔒 — Pembaruan konfigurasi yayasan oleh admin.
- `GET /api/stats/dashboard` 🔒 — Data agregasi statistik & grafik untuk admin.

*(Tanda 🔒 menunjukkan endpoint yang memerlukan akses Administrator).*

---

## 🐳 Manajemen Kontainer Docker

```bash
# Menyalakan semua kontainer
docker compose up -d

# Memantau logs secara live
docker compose logs -f

# Melihat status kontainer (memastikan healthy)
docker compose ps

# Mem-build ulang setelah ada perubahan kode
docker compose up -d --build

# Menghentikan kontainer
docker compose down

# Menghentikan kontainer dan mereset volume data (Fresh start)
docker compose down -v
```
