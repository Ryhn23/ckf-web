import prisma from '../config/prisma.js';
import asyncHandler from '../utils/asyncHandler.js';

/** GET /api/settings (publik) — semua setting sebagai object key→value. */
export const getAll = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  const rows = await prisma.setting.findMany();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.json({ data: settings });
});

/** PUT /api/settings (admin) — body: { key: value, ... } */
export const updateAll = asyncHandler(async (req, res) => {
  const entries = Object.entries(req.body || {});
  if (entries.length === 0) return res.json({ data: {} });

  await prisma.$transaction(
    entries.map(([key, value]) => {
      const strVal = value === null || value === undefined ? '' : String(value);
      return prisma.setting.upsert({
        where: { key },
        update: { value: strVal },
        create: { key, value: strVal },
      });
    }),
  );

  const rows = await prisma.setting.findMany();
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.json({ data: Object.fromEntries(rows.map((r) => [r.key, r.value])) });
});
