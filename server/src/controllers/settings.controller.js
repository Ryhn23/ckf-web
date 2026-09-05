import prisma from '../config/prisma.js';
import asyncHandler from '../utils/asyncHandler.js';

/** GET /api/settings (publik) — semua setting sebagai object key→value. */
export const getAll = asyncHandler(async (req, res) => {
  const rows = await prisma.setting.findMany();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.json({ data: settings });
});

/** PUT /api/settings (admin) — body: { key: value, ... } */
export const updateAll = asyncHandler(async (req, res) => {
  const entries = Object.entries(req.body || {});
  if (entries.length === 0) return res.json({ data: {} });

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      }),
    ),
  );

  const rows = await prisma.setting.findMany();
  res.json({ data: Object.fromEntries(rows.map((r) => [r.key, r.value])) });
});
