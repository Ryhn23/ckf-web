import { Router } from 'express';
import prisma from '../config/prisma.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

/** GET /api/testimonials (publik) */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await prisma.testimonial.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ data });
  }),
);

export default router;
