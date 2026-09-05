import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import pinoHttp from 'pino-http';
import path from 'node:path';
import fs from 'node:fs';

import env from './config/env.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import postRoutes from './routes/post.routes.js';
import categoryRoutes from './routes/category.routes.js';
import mediaRoutes from './routes/media.routes.js';
import statsRoutes from './routes/stats.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import testimonialRoutes from './routes/testimonial.routes.js';
import donationRoutes from './routes/donation.routes.js';
import contactRoutes from './routes/contact.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

const allowedOrigins = (env.clientOrigin || '')
  .split(/[,;]/)
  .map((s) => s.trim())
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, same-origin)
  if (!origin) return true;

  // Direct match or wildcard from CLIENT_ORIGIN
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    return true;
  }

  // Check wildcards in allowedOrigins (e.g. https://*.cintakasihfatimah.com)
  for (const allowed of allowedOrigins) {
    if (allowed.includes('*')) {
      const escaped = allowed.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      if (new RegExp(`^${escaped}$`, 'i').test(origin)) {
        return true;
      }
    }
  }

  // cintakasihfatimah.com and all its subdomains (http/https, optional port)
  if (/^https?:\/\/([a-z0-9-]+\.)*cintakasihfatimah\.com(:\d+)?$/i.test(origin)) {
    return true;
  }

  // localhost and all its subdomains (http/https, optional port)
  if (/^https?:\/\/([a-z0-9-]+\.)*localhost(:\d+)?$/i.test(origin)) {
    return true;
  }

  // 127.0.0.1 and IPv6 [::1] (http/https, optional port)
  if (/^https?:\/\/(127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin)) {
    return true;
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(compression());
app.use(env.isProd ? pinoHttp({ pino: { transport: false }, autoLogging: { ignore: (req) => req.url === '/health' } }) : morgan('dev'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Static uploads
const uploadDir = path.resolve(process.cwd(), env.uploadDir);
fs.mkdirSync(uploadDir, { recursive: true });
app.use(
  '/uploads',
  express.static(uploadDir, {
    maxAge: '7d',
    immutable: true,
    fallthrough: false,
  }),
);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/contact-messages', contactRoutes);
app.use('/api/users', userRoutes);

// 404 + error handler (paling akhir)
app.use(notFound);
app.use(errorHandler);

export default app;
