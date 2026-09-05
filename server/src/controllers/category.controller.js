import asyncHandler from '../utils/asyncHandler.js';
import * as categoryService from '../services/category.service.js';

/** GET /api/categories */
export const list = asyncHandler(async (req, res) => {
  const data = await categoryService.listCategories();
  res.json({ data });
});

/** POST /api/categories (admin) */
export const create = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json({ data: category });
});

/** PUT /api/categories/:id (admin) */
export const update = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  res.json({ data: category });
});

/** DELETE /api/categories/:id (admin) */
export const remove = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  res.json({ message: 'Kategori dihapus' });
});
