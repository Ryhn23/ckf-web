import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.js';
import slugify from '../utils/slugify.js';

/** Semua kategori (urutan sortOrder) + jumlah post published untuk filter. */
export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { posts: { where: { status: 'PUBLISHED' } } } },
    },
  });
}

export async function createCategory({ name, description, icon }) {
  const slug = slugify(name);
  const exists = await prisma.category.findFirst({
    where: { OR: [{ name: { equals: name, mode: 'insensitive' } }, { slug }] },
  });
  if (exists) throw ApiError.conflict('Kategori dengan nama tersebut sudah ada');

  const sortOrder = (await prisma.category.count()) || 0;

  return prisma.category.create({
    data: { name, slug, description: description || null, icon: icon || 'fa-solid fa-circle', sortOrder },
  });
}

export async function updateCategory(id, { name, description, icon, sortOrder }) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Kategori tidak ditemukan');

  let slug = existing.slug;
  if (name && name !== existing.name) {
    const candidate = slugify(name);
    const clash = await prisma.category.findFirst({
      where: { OR: [{ name: { equals: name, mode: 'insensitive' } }, { slug: candidate }], NOT: { id } },
    });
    if (clash) throw ApiError.conflict('Kategori dengan nama tersebut sudah ada');
    slug = candidate;
  }

  return prisma.category.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description: description || null }),
      ...(icon && { icon }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(slug !== existing.slug && { slug }),
    },
  });
}

export async function deleteCategory(id) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Kategori tidak ditemukan');

  const postCount = await prisma.post.count({ where: { categoryId: id } });
  if (postCount > 0) {
    throw ApiError.conflict(`Kategori masih memiliki ${postCount} post. Pindahkan atau hapus postnya terlebih dahulu.`);
  }

  await prisma.category.delete({ where: { id } });
  return existing;
}
