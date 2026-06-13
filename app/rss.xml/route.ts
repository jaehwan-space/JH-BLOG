import { PostStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, siteConfig } from "@/lib/site";

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 30,
    include: { category: true, tags: { include: { tag: true } } }
  });

  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/posts/${post.slug}`);
      return `
        <item>
          <title><![CDATA[${post.title}]]></title>
          <link>${url}</link>
          <guid>${url}</guid>
          <description><![CDATA[${post.excerpt}]]></description>
          <category><![CDATA[${post.category.name}]]></category>
          <pubDate>${(post.publishedAt || post.createdAt).toUTCString()}</pubDate>
        </item>
      `;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>${siteConfig.name}</title>
        <link>${siteConfig.url}</link>
        <description>${siteConfig.description}</description>
        <language>ko-KR</language>
        ${items}
      </channel>
    </rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    }
  });
}
