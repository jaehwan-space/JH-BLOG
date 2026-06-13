import { NextResponse } from "next/server";
import { getPublishedPosts } from "@/lib/data";
import { readingMinutes } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";
  const categorySlug = searchParams.get("category")?.trim() || undefined;
  const tagSlug = searchParams.get("tag")?.trim() || undefined;
  const posts = await getPublishedPosts({ query, categorySlug, tagSlug });

  return NextResponse.json({
    query,
    category: categorySlug || null,
    tag: tagSlug || null,
    results: posts.slice(0, 8).map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      cover: post.cover,
      category: {
        name: post.category.name,
        slug: post.category.slug
      },
      tags: post.tags.map(({ tag }) => ({
        name: tag.name,
        slug: tag.slug
      })),
      readingMinutes: readingMinutes(post.content),
      views: post.views,
      comments: post._count.comments,
      publishedAt: post.publishedAt?.toISOString() || null,
      createdAt: post.createdAt.toISOString()
    }))
  });
}
