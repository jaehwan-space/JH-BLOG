import { Prisma, PostStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fallbackSlug } from "@/lib/slug";

export const postListInclude = {
  category: true,
  tags: { include: { tag: true } },
  _count: { select: { comments: true } }
} satisfies Prisma.PostInclude;

export const postDetailInclude = {
  category: true,
  tags: { include: { tag: true } },
  comments: { orderBy: { createdAt: "desc" } },
  _count: { select: { comments: true } }
} satisfies Prisma.PostInclude;

export const featuredPostInclude = {
  post: {
    include: postListInclude
  }
} satisfies Prisma.FeaturedPostInclude;

export type PostListItem = Prisma.PostGetPayload<{ include: typeof postListInclude }>;
export type PostDetail = Prisma.PostGetPayload<{ include: typeof postDetailInclude }>;
export type FeaturedPostItem = Prisma.FeaturedPostGetPayload<{ include: typeof featuredPostInclude }>;
export type RecentCommentItem = Prisma.CommentGetPayload<{
  include: { post: { select: { title: true; slug: true } } };
}>;
export type CategorySeriesItem = Prisma.CategoryGetPayload<{
  include: {
    _count: { select: { posts: true } };
    posts: { select: { title: true; slug: true; cover: true } };
  };
}>;

type PublishedPostQueryOptions = {
  query?: string;
  categorySlug?: string;
  tagSlug?: string;
};

function publishedPostWhere(options: PublishedPostQueryOptions = {}) {
  const query = options.query?.trim();
  return {
    status: PostStatus.PUBLISHED,
    ...(options.categorySlug ? { category: { slug: options.categorySlug } } : {}),
    ...(options.tagSlug ? { tags: { some: { tag: { slug: options.tagSlug } } } } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { excerpt: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
            { category: { name: { contains: query, mode: "insensitive" } } },
            { tags: { some: { tag: { name: { contains: query, mode: "insensitive" } } } } }
          ]
        }
      : {})
  } satisfies Prisma.PostWhereInput;
}

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: { where: { status: PostStatus.PUBLISHED } } } } }
  });
}

export async function getTags() {
  return prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          posts: {
            where: {
              post: { status: PostStatus.PUBLISHED }
            }
          }
        }
      }
    }
  });
}

export async function getPublishedPosts(options: {
  query?: string;
  categorySlug?: string;
  tagSlug?: string;
} = {}) {
  return prisma.post.findMany({
    where: publishedPostWhere(options),
    include: postListInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
  });
}

export async function getPublishedPostPage(
  options: PublishedPostQueryOptions & {
    page?: number;
    pageSize?: number;
  } = {}
) {
  const pageSize = Math.max(1, options.pageSize || 5);
  const where = publishedPostWhere(options);
  const total = await prisma.post.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, options.page || 1), totalPages);

  const posts = await prisma.post.findMany({
    where,
    include: postListInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize
  });

  return {
    posts,
    total,
    page,
    pageSize,
    totalPages
  };
}

export async function getFeaturedPosts(take = 3) {
  const entries = await prisma.featuredPost.findMany({
    where: {
      post: { status: PostStatus.PUBLISHED }
    },
    include: featuredPostInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take
  });

  return entries.map((entry) => entry.post);
}

export async function getPopularPosts(take = 3) {
  return prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    include: postListInclude,
    orderBy: [{ views: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take
  });
}

export async function getRecentComments(take = 4) {
  return prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        select: {
          title: true,
          slug: true
        }
      }
    },
    take
  });
}

export async function getCategorySeries(take = 4) {
  return prisma.category.findMany({
    where: {
      posts: {
        some: { status: PostStatus.PUBLISHED }
      }
    },
    include: {
      _count: { select: { posts: { where: { status: PostStatus.PUBLISHED } } } },
      posts: {
        where: { status: PostStatus.PUBLISHED },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        select: { title: true, slug: true, cover: true },
        take: 1
      }
    },
    orderBy: { updatedAt: "desc" },
    take
  });
}

export async function getPostBySlug(slug: string, includeDraft = false) {
  return prisma.post.findFirst({
    where: {
      slug,
      ...(includeDraft ? {} : { status: PostStatus.PUBLISHED })
    },
    include: postDetailInclude
  });
}

export async function getAdminPost(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: postDetailInclude
  });
}

export async function incrementPostView(postId: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.$transaction([
    prisma.post.update({
      where: { id: postId },
      data: { views: { increment: 1 } }
    }),
    prisma.postViewStat.upsert({
      where: { postId_date: { postId, date: today } },
      update: { views: { increment: 1 } },
      create: { postId, date: today, views: 1 }
    })
  ]);
}

export async function ensureUniqueSlug(rawSlug: string, currentPostId?: string) {
  const base = fallbackSlug(rawSlug);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.post.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === currentPostId) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}
