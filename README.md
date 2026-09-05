# Cinta Kasih Fatimah (CKF Web)

Public web portal and content management system for the Cinta Kasih Fatimah Foundation. The application features a dynamic blog with a rich-text editor, media gallery, impact statistics, donation and contact inquiry forms, and an administrative configuration panel.

**Stack:** React 18, Vite, Express.js, Prisma ORM, PostgreSQL 15, Tailwind CSS, Nginx, Docker.

---

## Getting Started

You can run the entire stack using Docker Compose (recommended) or set up the development environment manually on your host machine.

### Method 1: Docker Compose (Recommended)

Docker Compose provisions PostgreSQL, the Express API, and an Nginx-backed frontend SPA. The backend entrypoint automatically waits for the database, synchronizes the Prisma schema, and runs idempotent initial seeds.

```bash
docker compose up -d
```

Once initialized, services are accessible at:

| Service | URL / Port | Notes |
| :--- | :--- | :--- |
| Frontend Web | http://localhost:5173 or http://localhost | Public portal served via Nginx |
| Admin Panel | http://localhost:5173/admin/login | CMS dashboard |
| Backend API | http://localhost:4000 (direct) or http://localhost:5173/api | Express REST API |
| PostgreSQL | localhost:5433 | Database: `ckf_blog`, User: `postgres`, Password: `postgres` |

**Default Seed Credentials:**
- Email: `admin@ckf.or.id`
- Password: `admin123`

### Method 2: Local Development

**Prerequisites:** Node.js 20+, npm, and Docker (to run local PostgreSQL).

```bash
# 1. Install dependencies across all workspaces
npm run setup

# 2. Start PostgreSQL container in background (port 5433)
docker compose up -d db

# 3. Synchronize database schema
npm run migrate

# 4. Seed initial records
npm run seed

# 5. Start API (:4000) and Vite dev server (:5173) concurrently
npm run dev
```

---

## npm Scripts

Run these scripts from the repository root:

| Script | Description |
| :--- | :--- |
| `npm run setup` | Install dependencies in root and all workspaces (`client` and `server`) |
| `npm run dev` | Run backend (:4000) and frontend (:5173) concurrently |
| `npm run dev:server` | Run Express server with nodemon |
| `npm run dev:client` | Run Vite development server |
| `npm run migrate` | Push Prisma schema changes |
| `npm run seed` | Seed default admin, categories, sample posts, testimonials, and settings |
| `npm run build` | Build production frontend bundle to `client/dist` |

---

## Project Structure

```text
├── docker-compose.yml        # Multi-container setup (db, backend, frontend)
├── package.json              # npm workspaces configuration
├── client/                   # Frontend React SPA (Vite, Tailwind CSS)
│   ├── Dockerfile            # Multi-stage build (Node builder -> Nginx Alpine)
│   ├── nginx.conf            # Reverse proxy (/api, /uploads), caching, SPA fallback
│   └── src/
│       ├── api/              # Axios API clients per domain
│       ├── components/       # Layout, Navbar, Footer, UI components
│       ├── context/          # AuthContext (JWT cookie), SettingsContext
│       ├── pages/
│       │   ├── (public)      # Home, About, Programs, Blog, Gallery, Donate, Contact
│       │   └── admin/        # Lazy-loaded dashboard, posts, media, settings
│       └── lib/fa-icons.js   # FontAwesome icon library registration
└── server/                   # Backend Express API (Node.js ESM)
    ├── Dockerfile            # Node 20 Bookworm Slim with OpenSSL and native sharp
    ├── docker-entrypoint.sh  # DB wait loop, automated schema push, seed script
    ├── prisma/
    │   └── schema.prisma     # Models: User, Category, Post, Media, Setting, Donation, Contact
    └── src/
        ├── config/           # Environment and Prisma client configuration
        ├── controllers/      # Route handlers and business logic
        ├── middlewares/      # Authentication, validation, rate limiting, error handling
        ├── routes/           # Modular route definitions
        ├── seed/seed.js      # Seed generator with automated WebP cover generation
        └── utils/            # JWT, custom errors, file upload pipeline
```

---

## Architecture and Key Decisions

- **Reverse Proxy:** The Nginx frontend container proxies `/api` and `/uploads` directly to the backend service over Docker internal networking. Regex rules for static asset caching use the `^~` modifier to prevent intercepting uploaded media requests.
- **Code Splitting:** Admin views are split via `React.lazy` and wrapped in `Suspense` fallbacks, keeping the initial client bundle footprint around 530 KB.
- **Authentication:** Sessions use httpOnly JWT cookies (`ckf_token`). Protected administrative routes enforce role checks via backend middleware.
- **Media Pipeline:** Uploads are handled via Multer and converted to optimized WebP format at 1600x900 resolution using Sharp.
- **Database Port Mapping:** PostgreSQL maps internally to `5432` and exposes host port `5433` to prevent conflicts with pre-existing local PostgreSQL instances.

---

## API Reference

Base path: `/api` (or `http://localhost:4000/api`).  
Responses follow standard envelope format: `{ "data": ... }` on success and `{ "error": { "code", "message" } }` on error.

### Authentication & Users
- `POST /api/auth/login` - Authenticate user, sets httpOnly JWT cookie.
- `GET /api/auth/me` - Fetch authenticated user profile.
- `POST /api/auth/logout` - Clear session cookie.
- `GET|POST|PUT|DELETE /api/users` *(Admin)* - User account management.

### Blog Posts & Categories
- `GET /api/posts` - Paginated post listing (query params: `page`, `limit`, `category`, `q`, `sort`).
- `GET /api/posts/featured` - Retrieve top featured posts.
- `GET /api/posts/:slug` - Fetch post detail and increment view count.
- `POST|PUT|DELETE /api/posts` *(Admin)* - Manage post content and cover images.
- `GET /api/categories` - List all article and program categories.
- `POST|PUT|DELETE /api/categories` *(Admin)* - Category management.

### Media & Gallery
- `GET /api/media/public` - Public gallery media items.
- `GET|DELETE /api/media` *(Admin)* - Media asset management.
- `POST /api/media/upload` *(Admin)* - Upload image asset.

### Donations, Inquiries & Settings
- `POST /api/donations` - Submit public donation confirmation.
- `GET|PATCH|DELETE /api/donations` *(Admin)* - Manage donation submissions.
- `POST /api/contact-messages` - Submit contact inquiry form.
- `GET|PATCH|DELETE /api/contact-messages` *(Admin)* - Review inquiry submissions.
- `GET /api/testimonials` - Fetch dynamic testimonials.
- `GET /api/settings` - Public organization identity and contact metadata.
- `PUT /api/settings` *(Admin)* - Update organization settings.
- `GET /api/stats/dashboard` *(Admin)* - Aggregated metrics and category breakdown.

---

## Docker Operations

```bash
# Start all containers in detached mode
docker compose up -d

# View live container logs
docker compose logs -f

# Inspect container status and healthchecks
docker compose ps

# Rebuild images after code updates
docker compose up -d --build

# Stop running containers
docker compose down

# Stop containers and wipe persistent database volumes (reset state)
docker compose down -v
```
