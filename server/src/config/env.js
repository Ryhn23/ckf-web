import 'dotenv/config';

const required = (key, fallback) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 4000,
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET', 'dev-secret-jangan-dipakai-di-prod'),
  jwtExpires: process.env.JWT_EXPIRES || '7d',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB) || 5,
};

export default env;
