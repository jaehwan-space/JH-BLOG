import Link from "next/link";
import { IconCover } from "@/components/IconCover";
import { formatDate, readingMinutes } from "@/lib/format";
import type { PostListItem } from "@/lib/data";

export function ArticleListItem({ post }: { post: PostListItem }) {
  const tags = post.tags.map((item) => item.tag);
  const hasCover = post.cover !== "none";

  return (
    <article
      className={hasCover ? "article-list-item article-list-item-with-cover" : "article-list-item"}
      data-cover={post.cover}
      data-testid={`article-list-item-${post.slug}`}
    >
      <div className="article-list-content">
        <div className="article-pill-row">
          <Link className="pill pill-active" href={`/categories/${post.category.slug}`}>
            {post.category.name}
          </Link>
          {tags.slice(0, 2).map((tag) => (
            <Link className="pill" href={`/tags/${tag.slug}`} key={tag.id}>
              #{tag.name}
            </Link>
          ))}
        </div>
        <Link className="article-list-title" href={`/posts/${post.slug}`}>
          {post.title}
        </Link>
        <p className="article-list-excerpt">{post.excerpt}</p>
        <p className="muted article-list-meta">
          {formatDate(post.publishedAt || post.createdAt)} · {readingMinutes(post.content)}분 읽기 · 조회{" "}
          {post.views.toLocaleString()} · 댓글 {post._count.comments}
        </p>
      </div>
      {hasCover ? (
        <Link className="article-list-cover" href={`/posts/${post.slug}`} aria-label={`${post.title} 썸네일`}>
          <IconCover cover={post.cover} label={post.category.name} compact />
        </Link>
      ) : null}
    </article>
  );
}
