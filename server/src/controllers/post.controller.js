import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { processCoverImage, removeUploadFile } from '../middlewares/upload.js';
import * as postService from '../services/post.service.js';

/** Parse field multipart yang datang sebagai string. */
function parseFields(body) {
  const out = { ...body };
  if (typeof out.tags === 'string') {
    try {
      const parsed = JSON.parse(out.tags);
      out.tags = Array.isArray(parsed) ? parsed.map(String).slice(0, 10) : [];
    } catch {
      out.tags = out.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10);
    }
  }
  if (typeof out.isFeatured === 'string') out.isFeatured = out.isFeatured === 'true';
  return out;
}

/** Ambil url cover dari file upload (jika ada). */
async function processCover(req) {
  const file = req.files?.[0] || req.file;
  if (!file) return null;
  try {
    return await processCoverImage(file.path);
  } catch (err) {
    removeUploadFile(file.path);
    throw err;
  }
}

/** GET /api/posts */
export const list = asyncHandler(async (req, res) => {
  const result = await postService.listPosts({ ...req.query, admin: !!req.user });
  res.json(result);
});

/** GET /api/posts/featured */
export const featured = asyncHandler(async (req, res) => {
  const data = await postService.featuredPosts();
  res.json({ data });
});

/** GET /api/posts/by-id/:id (admin) */
export const getById = asyncHandler(async (req, res) => {
  const post = await postService.getPostById(req.params.id);
  res.json({ data: post });
});

/** GET /api/posts/:slug */
export const getBySlug = asyncHandler(async (req, res) => {
  const result = await postService.getPostBySlug(req.params.slug);
  res.json(result);
});

/** POST /api/posts (admin, multipart) */
export const create = asyncHandler(async (req, res) => {
  const fields = parseFields(req.body);
  if (!fields.title || !fields.categoryId || !fields.content) {
    throw ApiError.badRequest('title, categoryId, dan content wajib diisi');
  }
  const coverUrl = await processCover(req);

  const post = await postService.createPost(
    { ...fields, status: fields.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED' },
    coverUrl,
    req.user.id,
  );

  res.status(201).json({ data: post });
});

/** PUT /api/posts/:id (admin, multipart) */
export const update = asyncHandler(async (req, res) => {
  const fields = parseFields(req.body);
  const coverUrl = await processCover(req);

  const post = await postService.updatePost(req.params.id, fields, coverUrl);
  res.json({ data: post });
});

/** DELETE /api/posts/:id (admin) */
export const remove = asyncHandler(async (req, res) => {
  const existing = await postService.deletePost(req.params.id);
  removeUploadFile(existing.coverImage);
  res.json({ message: 'Post dihapus' });
});
