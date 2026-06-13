import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createCommentAction } from "@/app/actions";
import { ArticleBackButton } from "@/components/ArticleBackButton";
import { CommentActions } from "@/components/CommentActions";
import { CommentToast } from "@/components/CommentToast";
import { MarkdownBody } from "@/components/MarkdownBody";
import { PublicHeader } from "@/components/PublicHeader";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { ShareButton } from "@/components/ShareButton";
import { formatDate, formatDateTime, readingMinutes } from "@/lib/format";
import { getPostBySlug, incrementPostView } from "@/lib/data";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);

  if (!post) {
    return {
      title: "글을 찾을 수 없습니다"
    };
  }

  const url = absoluteUrl(`/posts/${post.slug}`);
  const heroImageUrl = post.heroImageUrl ? absoluteUrl(post.heroImageUrl) : undefined;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: url
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      siteName: siteConfig.name,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: heroImageUrl
        ? [
            {
              url: heroImageUrl,
              alt: post.heroImageAlt || post.title
            }
          ]
        : undefined
    },
    twitter: {
      card: heroImageUrl ? "summary_large_image" : "summary",
      title: post.title,
      description: post.excerpt,
      images: heroImageUrl ? [heroImageUrl] : undefined
    }
  };
}

export default async function PostPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ comment?: string; commentError?: string }>;
}) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const post = await getPostBySlug(resolvedParams.slug);
  if (!post) notFound();

  await incrementPostView(post.id);
  const headings = extractHeadings(post.content);
  const visibleViews = post.views + 1;
  const commentToast = getReadableCommentToast(resolvedSearchParams?.comment, resolvedSearchParams?.commentError);
  const heroImage = post.heroImageUrl
    ? {
        url: post.heroImageUrl,
        alt: post.heroImageAlt || post.title
      }
    : null;

  return (
    <>
      <ReadingProgressBar />
      <PublicHeader />
      <main className="page-wrap grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="min-w-0">
          <header className="article-detail-header mx-auto max-w-3xl">
            <ArticleBackButton />
            <div className="article-detail-title-stack">
              <h1 className="article-detail-title">{post.title}</h1>
              <p className="article-detail-excerpt">{post.excerpt}</p>
              <div className="article-detail-date-group">
                <p className="article-detail-date">{formatDate(post.publishedAt || post.createdAt)}</p>
                <div className="article-detail-stats" aria-label="글 정보">
                  <span>{readingMinutes(post.content)}분 읽기</span>
                  <span>조회 {visibleViews.toLocaleString()}</span>
                  <span>댓글 {post.comments.length.toLocaleString()}</span>
                </div>
              </div>
            </div>
            {heroImage ? (
              <figure className="article-hero-image">
                <Image
                  src={heroImage.url}
                  alt={heroImage.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover"
                  priority
                  unoptimized
                />
              </figure>
            ) : null}
            <div className="article-detail-meta-row">
              <Link href={`/categories/${post.category.slug}`} className="pill pill-active">
                {post.category.name}
              </Link>
              {post.tags.map(({ tag }) => (
                <Link href={`/tags/${tag.slug}`} className="pill" key={tag.id}>
                  #{tag.name}
                </Link>
              ))}
            </div>
          </header>

          <section className="article-body-section mx-auto max-w-3xl">
            <MarkdownBody content={post.content} />
          </section>

          <section className="share-panel mx-auto mt-8 max-w-3xl" aria-label="공유하기">
            <span className="share-panel-label">공유</span>
            <ShareButton title={post.title} />
          </section>

          <section id="comments" className="comments-section mx-auto max-w-3xl">
            <div className="comments-header">
              <h2>댓글 {post.comments.length}</h2>
              <p>이름과 비밀번호를 입력하면 바로 댓글을 남길 수 있습니다.</p>
            </div>

            <form action={createCommentAction} className="comment-form">
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="slug" value={post.slug} />
              <div className="comment-field-grid">
                <label className="label">
                  이름
                  <input className="input" name="author" required maxLength={40} />
                </label>
                <label className="label">
                  비밀번호
                  <input className="input" name="password" required minLength={4} type="password" />
                </label>
              </div>
              <label className="label">
                댓글
                <textarea className="input comment-textarea" name="body" placeholder="댓글을 입력해주세요." required maxLength={1200} />
              </label>
              <div className="comment-submit-row">
                <button className="button button-primary" type="submit">
                  댓글 등록
                </button>
              </div>
            </form>

            <div className="comment-list">
              {post.comments.map((comment) => (
                <article className="comment-card" key={comment.id}>
                  <div className="comment-avatar" aria-hidden="true">
                    {comment.author.trim().slice(0, 1) || "J"}
                  </div>
                  <div className="comment-bubble">
                    <div className="comment-card-header">
                      <div>
                        <strong>{comment.author}</strong>
                        <span>{formatDateTime(comment.createdAt)}</span>
                      </div>
                      <CommentActions commentId={comment.id} slug={post.slug} body={comment.body} author={comment.author} />
                    </div>
                    <p className="comment-body">{comment.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-24 grid gap-5">
            <div className="side-panel">
              <h2 className="mb-3 font-black">목차</h2>
              {headings.length ? (
                <nav>
                  {headings.map((heading) => (
                    <a className="toc-link" href={`#${heading.id}`} key={heading.id}>
                      {heading.text}
                    </a>
                  ))}
                </nav>
              ) : (
                <p className="muted">목차가 없습니다.</p>
              )}
            </div>
          </div>
        </aside>
      </main>
      <CommentToast initialToast={commentToast} />
    </>
  );
}

function extractHeadings(content: string) {
  const counts = new Map<string, number>();
  const headings: Array<{ text: string; id: string }> = [];

  for (const line of content.split("\n")) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length;
    const text = match[2] || "";
    const baseId = slugifyHeading(text);
    const count = counts.get(baseId) || 0;
    const id = `user-content-${count ? `${baseId}-${count}` : baseId}`;
    counts.set(baseId, count + 1);

    if (level === 2 || level === 3) {
      headings.push({ text, id });
    }

    if (headings.length >= 8) break;
  }

  return headings;
}

function slugifyHeading(text: string) {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[`*_~[\]()>#]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

function getCommentToast(success?: string, error?: string) {
  if (success === "created") return { message: "댓글이 등록되었습니다.", variant: "success" as const };
  if (success === "updated") return { message: "댓글이 수정되었습니다.", variant: "success" as const };
  if (success === "deleted") return { message: "댓글이 삭제되었습니다.", variant: "success" as const };
  if (error === "password") return { message: "댓글 비밀번호가 올바르지 않습니다.", variant: "error" as const };
  if (error === "missing") return { message: "이름, 비밀번호, 댓글 내용을 모두 입력해주세요.", variant: "error" as const };
  if (error === "rate") return { message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", variant: "error" as const };
  return null;
}

function getReadableCommentToast(success?: string, error?: string) {
  if (success === "created") return { message: "댓글이 등록되었습니다.", variant: "success" as const };
  if (success === "updated") return { message: "댓글이 수정되었습니다.", variant: "success" as const };
  if (success === "deleted") return { message: "댓글이 삭제되었습니다.", variant: "success" as const };
  if (error === "password") return { message: "댓글 비밀번호가 올바르지 않습니다.", variant: "error" as const };
  if (error === "missing") return { message: "이름, 비밀번호, 댓글 내용을 모두 입력해주세요.", variant: "error" as const };
  if (error === "rate") return { message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", variant: "error" as const };
  return null;
}
