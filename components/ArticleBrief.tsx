import Link from "next/link";
import type { PostDetail } from "@/lib/data";
import { formatDate, readingMinutes } from "@/lib/format";

export function ArticleBrief({ post, visibleViews }: { post: PostDetail; visibleViews: number }) {
  const stats = [
    { label: "발행일", value: formatDate(post.publishedAt || post.createdAt) },
    { label: "읽는 시간", value: `${readingMinutes(post.content)}분` },
    { label: "조회", value: visibleViews.toLocaleString() },
    { label: "댓글", value: post.comments.length.toLocaleString() }
  ];

  return (
    <aside className="article-brief">
      <div className="flex flex-wrap gap-2">
        <Link href={`/categories/${post.category.slug}`} className="pill pill-active">
          {post.category.name}
        </Link>
        {post.tags.map(({ tag }) => (
          <Link href={`/tags/${tag.slug}`} className="pill" key={tag.id}>
            #{tag.name}
          </Link>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {stats.map((item) => (
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4" key={item.label}>
            <p className="text-xs font-bold text-slate-500">{item.label}</p>
            <p className="mt-1 text-sm font-black text-slate-950">{item.value}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
