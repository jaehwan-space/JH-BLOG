import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { MarkdownBody } from "@/components/MarkdownBody";
import { getAdminPost } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import { formatDate, readingMinutes } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPostPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const resolvedParams = await params;
  const post = await getAdminPost(resolvedParams.id);

  if (!post) notFound();

  return (
    <AdminShell
      title="공개 전 미리보기"
      subtitle="초안도 실제 글 상세 화면과 가까운 형태로 확인합니다."
      action={
        <Link href={`/admin/posts/${post.id}/edit`} className="button button-primary">
          다시 편집
        </Link>
      }
    >
      <article className="mx-auto grid max-w-4xl gap-6">
        <header className="article-detail-header">
          <div className="article-detail-title-stack">
            <h1 className="article-detail-title">{post.title}</h1>
            <p className="article-detail-excerpt">{post.excerpt}</p>
            <div className="article-detail-date-group">
              <p className="article-detail-date">{formatDate(post.publishedAt || post.createdAt)}</p>
              <div className="article-detail-stats" aria-label="글 정보">
                <span>{readingMinutes(post.content)}분 읽기</span>
                <span>조회 {post.views.toLocaleString()}</span>
                <span>댓글 {post.comments.length}</span>
              </div>
            </div>
          </div>
          {post.heroImageUrl ? (
            <figure className="article-hero-image">
              <Image
                src={post.heroImageUrl}
                alt={post.heroImageAlt || post.title}
                fill
                sizes="(max-width: 768px) 100vw, 896px"
                className="object-cover"
                unoptimized
              />
            </figure>
          ) : null}
          <div className="article-detail-meta-row">
            <span className="pill pill-active">{post.category.name}</span>
            {post.tags.map(({ tag }) => (
              <span className="pill" key={tag.id}>
                #{tag.name}
              </span>
            ))}
            <span>{post.status === "PUBLISHED" ? "발행" : "초안"}</span>
          </div>
        </header>
        <section className="card p-5 sm:p-8">
          <MarkdownBody content={post.content} />
        </section>
      </article>
    </AdminShell>
  );
}
