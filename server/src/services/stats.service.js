import prisma from '../config/prisma.js';

/** Statistik dashboard admin. */
export async function dashboard() {
  const [
    totalPosts,
    published,
    drafts,
    totalViews,
    categoryCount,
    recentPosts,
    totalDonations,
    totalDonationAmount,
    pendingDonations,
    unreadMessages,
    totalMedia,
    totalTestimonials,
  ] = await Promise.all([
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
    prisma.donation.count({ where: { status: 'PROCESSED' } }),
    prisma.donation.aggregate({ where: { status: 'PROCESSED' }, _sum: { amount: true } }).then((r) => r._sum.amount || 0),
    prisma.donation.count({ where: { status: 'PENDING' } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.media.count(),
    prisma.testimonial.count(),
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
    totalDonations,
    totalDonationAmount,
    pendingDonations,
    unreadMessages,
    totalMedia,
    totalTestimonials,
    viewsByCategory: byCategory
      .map((r) => ({ category: catName[r.categoryId] || 'Unknown', views: r._sum.views || 0 }))
      .sort((a, b) => b.views - a.views),
  };
}
