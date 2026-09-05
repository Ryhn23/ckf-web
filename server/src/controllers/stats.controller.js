import asyncHandler from '../utils/asyncHandler.js';
import * as statsService from '../services/stats.service.js';

/** GET /api/stats/dashboard (admin) */
export const dashboard = asyncHandler(async (req, res) => {
  const data = await statsService.dashboard();
  res.json({ data });
});
