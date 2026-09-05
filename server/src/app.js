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

app.use(helmet());
const allowedOrigins = (env.clientOrigin || '').split(',').map((s) => s.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} tidak diizinkan oleh CORS`));
      }
    },
    credentials: true,
  }),
);
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
