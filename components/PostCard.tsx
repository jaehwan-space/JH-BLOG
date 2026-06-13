import Link from "next/link";
import { PostListItem } from "@/lib/data";
import { formatDate, readingMinutes } from "@/lib/format";
import { IconCover } from "@/components/IconCover";

export function PostCard({ post, featured = false }: { post: PostListItem; featured?: boolean }) {
  const tags = post.tags.map((item) => item.tag);
  const hasCover = post.cover !== "none";

  return (
    <article className="card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
      {hasCover ? (
        <Link href={`/posts/${post.slug}`} aria-label={post.title}>
          <IconCover cover={post.cover} label={post.category.name} compact={!featured} />
        </Link>
      ) : null}
      <div className="grid gap-4 p-5">
        <div className="muted">
          {formatDate(post.publishedAt || post.createdAt)} · {readingMinutes(post.content)}분 읽기 · 조회{" "}
          {post.views.toLocaleString()} · 댓글 {post._count.comments}
        </div>
        <div className="grid gap-2">
          <Link href={`/posts/${post.slug}`} className="text-xl font-black leading-tight text-slate-950 hover:text-primary-strong">
            {post.title}
          </Link>
          <p className="line-clamp-2 text-sm text-slate-600">{post.excerpt}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 4).map((tag) => (
            <Link key={tag.id} href={`/tags/${tag.slug}`} className="pill">
              #{tag.name}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}
