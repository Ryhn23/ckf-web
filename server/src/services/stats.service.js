import prisma from '../config/prisma.js';

/** Statistik dashboard admin. */
export async function dashboard() {
  const [totalPosts, published, drafts, totalViews, categoryCount, recentPosts] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.post.count({ where: { status: 'DRAFT' } }),
    prisma.post.aggregate({ _sum: { views: true } }).then((r) => r._sum.views || 0),
    prisma.category.count(),
    prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        views: true,
        publishedAt: true,
        category: { select: { name: true, slug: true } },
      },
    }),
  ]);

  // Views per kategori (untuk bar chart)
  const [byCategory, categories] = await Promise.all([
    prisma.post.groupBy({ by: ['categoryId'], _sum: { views: true } }),
    prisma.category.findMany({ select: { id: true, name: true } }),
  ]);
  const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return {
    totalPosts,
    published,
    drafts,
    totalViews,
    categoryCount,
    recentPosts,
    viewsByCategory: byCategory
      .map((r) => ({ category: catName[r.categoryId] || 'Unknown', views: r._sum.views || 0 }))
      .sort((a, b) => b.views - a.views),
  };
}
