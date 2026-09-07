import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import slugify from '../utils/slugify.js';
import sanitizeHtml from 'sanitize-html';

/** Allowlist tag quill — buang script/style/iframe/onclick dsb. */
export function sanitizeContent(html) {
  return sanitizeHtml(String(html ?? ''), {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'a', 'blockquote', 'code', 'pre',
      'strong', 'b', 'em', 'i', 'u', 's', 'span',
      'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      '*': ['class'],
    },
    allowedSchemes: ['http', 'https', 'data'],
  });
}

async function uniqueSlug(title, excludeId = null) {
  const base = slugify(title) || 'post';
  let slug = base;
  let i = 2;
  while (true) {
    const where = excludeId ? { slug, NOT: { id: excludeId } } : { slug };
    const found = await prisma.post.findFirst({ where, select: { id: true } });
    if (!found) return slug;
    slug = `${base}-${i++}`;
  }
}

const PUBLIC_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  status: true,
  isFeatured: true,
  publishedAt: true,
  views: true,
  tags: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true, icon: true } },
  author: { select: { id: true, name: true, avatar: true } },
};

/**
 * Listing post + filter + pagination.
 */
export async function listPosts({ page = 1, limit = 9, category, tag, search, status, isFeatured, admin = false }) {
  const where = {};

  if (admin) {
    if (status) where.status = status;
  } else {
    where.status = 'PUBLISHED';
  }
  if (category && category !== 'all') {
    where.category = { slug: category };
  }
  if (tag) {
    // tags disimpan sebagai JSON array string
    where.tags = { contains: tag.toLowerCase() };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (isFeatured === true) where.isFeatured = true;

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);

  const [total, data] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      select: PUBLIC_SELECT,
      orderBy: admin && status === 'DRAFT' ? { createdAt: 'desc' } : { publishedAt: 'desc' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
  ]);

  return {
    data,
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

/** Post featured untuk carousel beranda. */
export async function featuredPosts(limit = 10) {
  return prisma.post.findMany({
    where: { isFeatured: true, status: 'PUBLISHED' },
    select: PUBLIC_SELECT,
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });
}

/** Detail post publik + increment views. */
export async function getPostBySlug(slug) {
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || post.status !== 'PUBLISHED') throw ApiError.notFound('Post tidak ditemukan');

  const [full, related] = await Promise.all([
    (async () => {
      await prisma.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } });
      return prisma.post.findUnique({
        where: { id: post.id },
        include: { category: true, author: true },
      });
    })(),
    prisma.post.findMany({
      where: { categoryId: post.categoryId, status: 'PUBLISHED', NOT: { id: post.id } },
      select: PUBLIC_SELECT,
      orderBy: { publishedAt: 'desc' },
      take: 3,
    }),
  ]);

  return { post: full, related };
}

/** Detail post by id (admin — untuk editor). */
export async function getPostById(id) {
  const post = await prisma.post.findUnique({ where: { id }, include: { category: true, author: true } });
  if (!post) throw ApiError.notFound('Post tidak ditemukan');
  return post;
}

/** Buat post baru. */
export async function createPost({ title, slug: customSlug, excerpt, content, categoryId, isFeatured, status, tags, publishedAt: customPublishedAt }, coverUrl, authorId) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw ApiError.badRequest('Kategori tidak valid');

  const slug = await uniqueSlug(customSlug || title);
  let publishedAt = null;
  if (status === 'PUBLISHED') {
    publishedAt = customPublishedAt ? new Date(customPublishedAt) : new Date();
  }

  return prisma.post.create({
    data: {
      title,
      slug,
      excerpt,
      content: sanitizeContent(content),
      coverImage: coverUrl || null,
      status,
      isFeatured: !!isFeatured,
      publishedAt,
      tags: Array.isArray(tags) ? tags : [],
      categoryId,
      authorId,
    },
  });
}

/** Update post. */
export async function updatePost(id, { title, slug: customSlug, excerpt, content, categoryId, isFeatured, status, tags, removeCover, publishedAt: customPublishedAt }, coverUrl) {
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Post tidak ditemukan');

  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw ApiError.badRequest('Kategori tidak valid');
  }

  let slug = existing.slug;
  if (customSlug && customSlug !== existing.slug) {
    slug = await uniqueSlug(customSlug, id);
  } else if (title && title !== existing.title && !customSlug) {
    slug = await uniqueSlug(title, id);
  }
  const statusChanged = status && status !== existing.status;

  let newCoverImage = undefined;
  if (coverUrl) {
    newCoverImage = coverUrl;
  } else if (removeCover) {
    newCoverImage = null;
  }

  let publishedAt = undefined;
  if (customPublishedAt) {
    publishedAt = new Date(customPublishedAt);
  } else if (customPublishedAt === null) {
    publishedAt = null;
  } else if (statusChanged && status === 'PUBLISHED' && !existing.publishedAt) {
    publishedAt = new Date();
  }

  return prisma.post.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(slug !== existing.slug && { slug }),
      ...(excerpt !== undefined && { excerpt }),
      ...(content !== undefined && { content: sanitizeContent(content) }),
      ...(categoryId && { categoryId }),
      ...(isFeatured !== undefined && { isFeatured: !!isFeatured }),
      ...(status && { status }),
      ...(publishedAt !== undefined && { publishedAt }),
      ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
      ...(newCoverImage !== undefined && { coverImage: newCoverImage }),
    },
  });
}

/** Hapus post + file cover. */
export async function deletePost(id) {
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Post tidak ditemukan');
  await prisma.post.delete({ where: { id } });
  return existing;
}
